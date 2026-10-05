import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	MAX_ANNOUNCEMENTS,
	MAX_LISTED_TRIALS,
	MAX_THREADS,
	MAX_USER_APPLICATIONS,
	MAX_USER_MEMBERSHIPS,
} from "../lib/limits";
import { trialCycleHref } from "../lib/links";
import { notify, notifyFounders } from "../people/notifications.rules";
import { logActivity } from "../teams/activity.rules";
import { getMembership } from "../teams/membership.rules";
import {
	getTrialApplication,
	isTrialLive,
	listTrialApplications,
} from "./trialCycles.rules";

type AnnouncementCtx = QueryCtx | MutationCtx;

export async function requireTrial(
	ctx: AnnouncementCtx,
	trialCycleId: Id<"trialCycles">,
): Promise<Doc<"trialCycles">> {
	const trial = await ctx.db.get(trialCycleId);
	if (!trial) {
		throw new Error("Trial Cycle not found");
	}
	return trial;
}

/**
 * Startup Members read every Announcement; entrants only once accepted, and
 * finished Participants keep reading after the close.
 */
export async function requireAnnouncementReader(
	ctx: AnnouncementCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
): Promise<void> {
	if (await getMembership(ctx, trial.startupId, userId)) {
		return;
	}
	const application = await getTrialApplication(ctx, trial._id, userId);
	if (application?.status !== "joined" && application?.status !== "completed") {
		throw new Error("You do not have access to this Trial Cycle");
	}
}

/** Announcements are read-only once the Trial Cycle is over. */
export function requireAnnouncementsOpen(trial: Doc<"trialCycles">): void {
	if (!isTrialLive(trial)) {
		throw new Error("This Trial Cycle is closed, so it is read-only");
	}
}

export async function loadLatestAnnouncements(
	ctx: AnnouncementCtx,
	trialCycleId: Id<"trialCycles">,
): Promise<Doc<"trialAnnouncements">[]> {
	return await ctx.db
		.query("trialAnnouncements")
		.withIndex("by_trial", (q) => q.eq("trialCycleId", trialCycleId))
		.order("desc")
		.take(MAX_ANNOUNCEMENTS);
}

/** Every current Participant and every other Founder hears about it. */
export async function announceToTrial(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	authorId: Id<"users">,
	body: string,
): Promise<void> {
	const title = `New announcement in ${trial.title}`;
	const href = await trialCycleHref(ctx, trial);
	for (const application of await listTrialApplications(ctx, trial._id)) {
		if (application.status === "joined") {
			await notify(ctx, {
				userId: application.userId,
				kind: "announcement",
				title,
				body,
				href,
			});
		}
	}
	await notifyFounders(
		ctx,
		trial.startupId,
		{ kind: "announcement", title, body, href },
		{ except: authorId },
	);
	await logActivity(ctx, {
		startupId: trial.startupId,
		kind: "trial_announcement_posted",
		trialCycleId: trial._id,
		summary: title,
	});
}

/**
 * Every Trial Cycle whose Announcements the person may read: the ones they
 * joined or finished, and the published ones of Startups they are on.
 */
export async function loadThreadTrials(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<Doc<"trialCycles">[]> {
	const trials = new Map<Id<"trialCycles">, Doc<"trialCycles">>();

	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.order("desc")
		.take(MAX_USER_APPLICATIONS);
	for (const application of applications) {
		if (application.status !== "joined" && application.status !== "completed") {
			continue;
		}
		const trial = await ctx.db.get(application.trialCycleId);
		if (trial) {
			trials.set(trial._id, trial);
		}
	}

	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_MEMBERSHIPS);
	for (const membership of memberships) {
		const startupTrials = await ctx.db
			.query("trialCycles")
			.withIndex("by_startup", (q) => q.eq("startupId", membership.startupId))
			.order("desc")
			.take(MAX_LISTED_TRIALS);
		for (const trial of startupTrials) {
			if (trial.status !== "draft") {
				trials.set(trial._id, trial);
			}
		}
	}

	return [...trials.values()];
}

export type Thread = {
	trialCycleId: Id<"trialCycles">;
	title: string;
	status: Doc<"trialCycles">["status"];
	startupName: string;
	href: string;
	announcementCount: number;
	latest: { body: string; createdAt: number } | null;
	/** The latest Announcement's time, or when the hackathon was created. */
	sortAt: number;
};

export async function buildThread(
	ctx: QueryCtx,
	trial: Doc<"trialCycles">,
): Promise<Thread> {
	const announcements = await loadLatestAnnouncements(ctx, trial._id);
	const latest = announcements[0];
	const startup = await ctx.db.get(trial.startupId);
	return {
		trialCycleId: trial._id,
		title: trial.title,
		status: trial.status,
		startupName: startup?.name ?? "Startup",
		href: await trialCycleHref(ctx, trial),
		announcementCount: announcements.length,
		latest: latest
			? { body: latest.body, createdAt: latest._creationTime }
			: null,
		sortAt: latest?._creationTime ?? trial._creationTime,
	};
}

/**
 * Newest activity first, at most `MAX_THREADS`. A cancelled hackathon with
 * nothing announced has nothing to read, so it is left out.
 */
export function pickThreads(threads: Thread[]): Thread[] {
	return threads
		.filter(
			(thread) => thread.status !== "cancelled" || thread.announcementCount > 0,
		)
		.sort((a, b) => b.sortAt - a.sortAt)
		.slice(0, MAX_THREADS);
}
