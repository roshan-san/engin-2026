import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { spendCredit } from "../billing/credits";
import { requireFounderMembership } from "../teams/membership";

export const NEW_DATES_MESSAGE =
	"This hackathon's start or application deadline has passed. Pick new dates, then publish.";

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
 * The charge point: spends one of the Founder's credits, opens the hackathon
 * and schedules its start. Run `requirePublishable` first.
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
		publishedAt: now,
		publishedByUserId: userId,
		creditSource: credit.source,
	});
	await ctx.scheduler.runAt(trial.startsAt, internal.hiring.trialCycles.start, {
		trialCycleId: trial._id,
	});
}
