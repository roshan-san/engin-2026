import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	MAX_ANNOUNCEMENTS,
	MAX_LISTED_HACKATHONS,
	MAX_THREADS,
	MAX_USER_APPLICATIONS,
	MAX_USER_MEMBERSHIPS,
} from "../lib/limits";
import { hackathonHref } from "../lib/links";
import { notify, notifyFounders } from "../people/notifications.rules";
import { logActivity } from "../teams/activity.rules";
import { getMembership } from "../teams/membership.rules";
import {
	getHackathonApplication,
	isHackathonLive,
	listHackathonApplications,
} from "./hackathons.rules";

type AnnouncementCtx = QueryCtx | MutationCtx;

export async function requireHackathon(
	ctx: AnnouncementCtx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"hackathons">> {
	const hackathon = await ctx.db.get(hackathonId);
	if (!hackathon) {
		throw new Error("Hackathon not found");
	}
	return hackathon;
}

/**
 * Startup Members read every Announcement; entrants only once accepted, and
 * finished Participants keep reading after the close.
 */
export async function requireAnnouncementReader(
	ctx: AnnouncementCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
): Promise<void> {
	if (await getMembership(ctx, hackathon.startupId, userId)) {
		return;
	}
	const application = await getHackathonApplication(ctx, hackathon._id, userId);
	if (
		application?.status !== "accepted" &&
		application?.status !== "completed"
	) {
		throw new Error("You do not have access to this Hackathon");
	}
}

/** Announcements are read-only once the Hackathon is over. */
export function requireAnnouncementsOpen(hackathon: Doc<"hackathons">): void {
	if (!isHackathonLive(hackathon)) {
		throw new Error("This Hackathon is closed, so it is read-only");
	}
}

export async function loadLatestAnnouncements(
	ctx: AnnouncementCtx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"hackathonAnnouncements">[]> {
	return await ctx.db
		.query("hackathonAnnouncements")
		.withIndex("by_hackathon", (q) => q.eq("hackathonId", hackathonId))
		.order("desc")
		.take(MAX_ANNOUNCEMENTS);
}

/** Every current Participant and every other Founder hears about it. */
export async function announceToHackathon(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	authorId: Id<"users">,
	body: string,
): Promise<void> {
	const title = `New announcement in ${hackathon.title}`;
	const href = await hackathonHref(ctx, hackathon);
	for (const application of await listHackathonApplications(
		ctx,
		hackathon._id,
	)) {
		if (application.status === "accepted") {
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
		hackathon.startupId,
		{ kind: "announcement", title, body, href },
		{ except: authorId },
	);
	await logActivity(ctx, {
		startupId: hackathon.startupId,
		kind: "hackathon_announcement_posted",
		hackathonId: hackathon._id,
		summary: title,
	});
}

/**
 * Every Hackathon whose Announcements the person may read: the ones they
 * accepted or finished, and the published ones of Startups they are on.
 */
export async function loadThreadHackathons(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<Doc<"hackathons">[]> {
	const hackathons = new Map<Id<"hackathons">, Doc<"hackathons">>();

	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.order("desc")
		.take(MAX_USER_APPLICATIONS);
	for (const application of applications) {
		if (
			application.status !== "accepted" &&
			application.status !== "completed"
		) {
			continue;
		}
		const hackathon = await ctx.db.get(application.hackathonId);
		if (hackathon) {
			hackathons.set(hackathon._id, hackathon);
		}
	}

	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_MEMBERSHIPS);
	for (const membership of memberships) {
		const startupHackathons = await ctx.db
			.query("hackathons")
			.withIndex("by_startup", (q) => q.eq("startupId", membership.startupId))
			.order("desc")
			.take(MAX_LISTED_HACKATHONS);
		for (const hackathon of startupHackathons) {
			if (hackathon.status !== "draft") {
				hackathons.set(hackathon._id, hackathon);
			}
		}
	}

	return [...hackathons.values()];
}

export type Thread = {
	hackathonId: Id<"hackathons">;
	title: string;
	status: Doc<"hackathons">["status"];
	startupName: string;
	href: string;
	announcementCount: number;
	latest: { body: string; createdAt: number } | null;
	/** The latest Announcement's time, or when the hackathon was created. */
	sortAt: number;
};

export async function buildThread(
	ctx: QueryCtx,
	hackathon: Doc<"hackathons">,
): Promise<Thread> {
	const announcements = await loadLatestAnnouncements(ctx, hackathon._id);
	const latest = announcements[0];
	const startup = await ctx.db.get(hackathon.startupId);
	return {
		hackathonId: hackathon._id,
		title: hackathon.title,
		status: hackathon.status,
		startupName: startup?.name ?? "Startup",
		href: await hackathonHref(ctx, hackathon),
		announcementCount: announcements.length,
		latest: latest
			? { body: latest.body, createdAt: latest._creationTime }
			: null,
		sortAt: latest?._creationTime ?? hackathon._creationTime,
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
