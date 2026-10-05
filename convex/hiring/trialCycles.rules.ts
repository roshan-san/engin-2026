import { type Infer, type ObjectType, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { refundPublishCredit } from "../billing/credits.rules";
import {
	MAX_TRIAL_APPLICATIONS,
	MAX_TRIAL_PARTICIPANTS,
	TRIAL_TEXT_LIMITS,
} from "../lib/limits";
import { trialCycleHref } from "../lib/links";
import { buildSearchText, limitText, requireLimitedText } from "../lib/text";
import { notify, notifyFounders } from "../people/notifications.rules";
import type { trialVerdict } from "../schema";
import { seedBoards } from "./challenges.rules";

type TrialCtx = QueryCtx | MutationCtx;

/** Everything a Founder sets on a draft; `create` and `update` both take all of it. */
export const draftFields = {
	roleId: v.id("roles"),
	title: v.string(),
	description: v.string(),
	maxContributors: v.number(),
	startsAt: v.number(),
	endsAt: v.number(),
	applicationDeadline: v.optional(v.number()),
	prize: v.optional(v.string()),
	expectedOutcome: v.optional(v.string()),
	evaluationCriteria: v.optional(v.string()),
	compensation: v.optional(v.string()),
	challenges: v.array(
		v.object({ title: v.string(), description: v.optional(v.string()) }),
	),
};

export type DraftInput = ObjectType<typeof draftFields>;

/**
 * The stored draft fields, trimmed and bounded. Optional fields left out come
 * back `undefined`, so a patch clears them.
 */
export function buildDraftFields(input: DraftInput, role: Doc<"roles">) {
	const title = requireLimitedText(
		input.title,
		"Title",
		TRIAL_TEXT_LIMITS.title,
	);
	const description = requireLimitedText(
		input.description,
		"Description",
		TRIAL_TEXT_LIMITS.description,
	);
	return {
		roleId: role._id,
		title,
		description,
		maxContributors: Math.min(
			MAX_TRIAL_PARTICIPANTS,
			Math.max(1, Math.floor(input.maxContributors)),
		),
		startsAt: input.startsAt,
		endsAt: input.endsAt,
		applicationDeadline: input.applicationDeadline,
		prize: limitText(input.prize, "Prize", TRIAL_TEXT_LIMITS.prize),
		expectedOutcome: limitText(
			input.expectedOutcome,
			"Expected outcome",
			TRIAL_TEXT_LIMITS.detail,
		),
		evaluationCriteria: limitText(
			input.evaluationCriteria,
			"Evaluation criteria",
			TRIAL_TEXT_LIMITS.detail,
		),
		compensation: limitText(
			input.compensation,
			"Compensation",
			TRIAL_TEXT_LIMITS.detail,
		),
		searchText: buildSearchText(title, description, role.title),
	};
}

export function isPassed(
	verdict: Infer<typeof trialVerdict> | undefined,
): boolean {
	return verdict === "passed" || verdict === "passed_with_offer";
}

export async function getTrialApplication(
	ctx: TrialCtx,
	trialCycleId: Id<"trialCycles">,
	userId: Id<"users">,
) {
	return await ctx.db
		.query("applications")
		.withIndex("by_trial_and_user", (q) =>
			q.eq("trialCycleId", trialCycleId).eq("userId", userId),
		)
		.unique();
}

export async function listTrialApplications(
	ctx: TrialCtx,
	trialCycleId: Id<"trialCycles">,
) {
	return await ctx.db
		.query("applications")
		.withIndex("by_trial", (q) => q.eq("trialCycleId", trialCycleId))
		.take(MAX_TRIAL_APPLICATIONS);
}

export function isTrialLive(trial: Doc<"trialCycles">): boolean {
	return trial.status === "open" || trial.status === "active";
}

/**
 * A hackathon anyone may read: published, and its Startup isn't in stealth.
 * Drafts, stealth and missing all come back `null`, so they look the same.
 */
export async function loadPublicTrial(
	ctx: TrialCtx,
	trialCycleId: Id<"trialCycles">,
) {
	const trial = await ctx.db.get(trialCycleId);
	if (!trial || trial.status === "draft") {
		return null;
	}
	const startup = await ctx.db.get(trial.startupId);
	if (!startup?.isPublic) {
		return null;
	}
	return { trial, startup };
}

/**
 * One schedule rule for create, update and reschedule: the end follows the
 * start, the start is ahead, and a deadline (if set) falls between now and the start.
 */
export function requireValidSchedule(
	schedule: {
		startsAt: number;
		endsAt: number;
		applicationDeadline?: number;
	},
	now: number,
): void {
	if (schedule.endsAt <= schedule.startsAt) {
		throw new Error("Trial Cycle end must be after start");
	}
	if (schedule.startsAt <= now) {
		throw new Error("Pick a start time in the future");
	}
	const deadline = schedule.applicationDeadline;
	if (deadline === undefined) {
		return;
	}
	if (deadline <= now) {
		throw new Error("Pick an application deadline in the future");
	}
	if (deadline > schedule.startsAt) {
		throw new Error("The application deadline must be before the start");
	}
}

/** The Role a hackathon is for: it belongs to this Startup and is still open. */
export async function requireOpenRoleOf(
	ctx: TrialCtx,
	startupId: Id<"startups">,
	roleId: Id<"roles">,
): Promise<Doc<"roles">> {
	const role = await ctx.db.get(roleId);
	if (!role || role.startupId !== startupId) {
		throw new Error("Role not found");
	}
	if (role.status !== "open") {
		throw new Error("This Role is closed");
	}
	return role;
}

/** Entry closes at the application deadline, or at the start when none is set. */
export function requireAcceptingEntries(trial: Doc<"trialCycles">) {
	if (trial.status === "draft") {
		throw new Error("This hackathon isn't published yet");
	}
	const entryClosesAt = trial.applicationDeadline ?? trial.startsAt;
	if (trial.status !== "open" || Date.now() > entryClosesAt) {
		throw new Error("This Trial Cycle is no longer accepting people");
	}
}

/** Ends a Trial Cycle without Verdicts; carries no Score consequence. */
export async function cancelTrial(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	reason?: string,
): Promise<void> {
	await refundPublishCredit(ctx, trial);
	await ctx.db.patch(trial._id, { status: "cancelled" });

	const href = await trialCycleHref(ctx, trial);
	for (const application of await listTrialApplications(ctx, trial._id)) {
		if (application.status !== "joined" && application.status !== "applied") {
			continue;
		}
		await notify(ctx, {
			userId: application.userId,
			kind: "trial_cycle",
			title: `${trial.title} was cancelled`,
			body: reason,
			href,
		});
	}
}

/**
 * Runs at the start time: pending applications are rejected, then the Trial
 * Cycle either becomes active or, with nobody in it, is cancelled.
 */
export async function startTrial(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
): Promise<void> {
	const applications = await listTrialApplications(ctx, trial._id);
	const href = await trialCycleHref(ctx, trial);

	for (const application of applications) {
		if (application.status !== "applied") {
			continue;
		}
		await ctx.db.patch(application._id, { status: "rejected" });
		await notify(ctx, {
			userId: application.userId,
			kind: "application",
			title: `${trial.title} started without your application being accepted`,
			href,
		});
	}

	if (trial.participantCount === 0) {
		await ctx.db.patch(trial._id, { status: "cancelled" });
		await notifyFounders(ctx, trial.startupId, {
			kind: "trial_cycle",
			title: `${trial.title} was cancelled: nobody joined`,
			href,
		});
		return;
	}

	await ctx.db.patch(trial._id, { status: "active" });
	const participants = applications.filter(
		(application) => application.status === "joined",
	);
	await seedBoards(
		ctx,
		trial._id,
		participants.map((application) => application.userId),
	);
	for (const application of participants) {
		await notify(ctx, {
			userId: application.userId,
			kind: "trial_cycle",
			title: `${trial.title} has started`,
			href,
		});
	}
}

export async function isTrialParticipant(
	ctx: TrialCtx,
	trialCycleId: Id<"trialCycles">,
	userId: Id<"users">,
): Promise<boolean> {
	const application = await getTrialApplication(ctx, trialCycleId, userId);
	return application?.status === "joined";
}
