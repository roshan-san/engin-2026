import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { spendCredit } from "../billing/credits.rules";
import { trialCycleHref } from "../lib/links";
import { notifyFounders } from "../people/notifications.rules";
import { logActivity } from "../teams/activity.rules";
import { requireFounderMembership } from "../teams/membership.rules";

/** The publish dialog matches these to offer the fix (new dates, edit). */
export const NEW_DATES_MESSAGE =
	"This hackathon's start or application deadline has passed. Pick new dates, then publish.";
export const NO_STARTING_PULSE_MESSAGE =
	"Add at least one Starting Pulse before publishing";

/**
 * Why a draft can't be published now, or null when it can. Checks run in the
 * eng review's C4 order; the Founder check is the caller's.
 */
export async function publishProblem(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	now: number,
): Promise<string | null> {
	if (trial.status !== "draft") {
		return "Only a draft can be published";
	}
	const startup = await ctx.db.get(trial.startupId);
	if (!startup?.isPublic) {
		return "Turn off stealth mode before publishing a public hackathon";
	}
	const role = await ctx.db.get(trial.roleId);
	if (role?.status !== "open") {
		return "This Role is closed";
	}
	const startingPulses = await ctx.db
		.query("challenges")
		.withIndex("by_trial", (q) => q.eq("trialCycleId", trial._id))
		.take(1);
	if (startingPulses.length === 0) {
		return NO_STARTING_PULSE_MESSAGE;
	}
	const entryClosesAt = trial.applicationDeadline ?? trial.startsAt;
	if (trial.startsAt <= now || entryClosesAt <= now) {
		return NEW_DATES_MESSAGE;
	}
	return null;
}

export async function requirePublishable(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
	now: number,
): Promise<void> {
	await requireFounderMembership(ctx, trial.startupId, userId);
	const problem = await publishProblem(ctx, trial, now);
	if (problem) {
		throw new Error(problem);
	}
}

/**
 * The charge point: spends one of the Founder's credits, opens the hackathon,
 * schedules its start and tells the other co-founders. Run
 * `requirePublishable` first.
 */
export async function publishDraft(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
	now: number,
): Promise<void> {
	const credit = await spendCredit(ctx, userId, trial._id, now);
	await ctx.db.patch(trial._id, {
		status: "open",
		publishedByUserId: userId,
		creditSource: credit.source,
		creditId: credit._id,
	});
	await ctx.scheduler.runAt(trial.startsAt, internal.hiring.trialCycles.start, {
		trialCycleId: trial._id,
	});
	await notifyFounders(
		ctx,
		trial.startupId,
		{
			kind: "trial_cycle",
			title: `${trial.title} is published`,
			href: await trialCycleHref(ctx, trial),
		},
		{ except: userId },
	);
	await logActivity(ctx, {
		startupId: trial.startupId,
		kind: "trial_cycle_published",
		trialCycleId: trial._id,
		summary: `Trial Cycle "${trial.title}" published`,
	});
}
