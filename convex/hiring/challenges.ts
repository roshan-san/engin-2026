import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import {
	type MutationCtx,
	mutation,
	type QueryCtx,
	query,
} from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { requireFounderMembership } from "../teams/membership.rules";
import {
	buildChallengeFields,
	listChallenges,
	requireChallengeRoom,
} from "./challenges.rules";

async function requireTrialAsFounder(
	ctx: QueryCtx | MutationCtx,
	trialCycleId: Id<"trialCycles">,
) {
	const userId = await requireUserId(ctx);
	const trial = await ctx.db.get(trialCycleId);
	if (!trial) {
		throw new Error("Trial Cycle not found");
	}
	await requireFounderMembership(ctx, trial.startupId, userId);
	return { trial, userId };
}

/**
 * Copies are made at the start, so later changes belong to mid-trial
 * Challenges. Drafts count as not started, so Founders seed before paying.
 */
function requireNotStarted(status: string) {
	if (status !== "draft" && status !== "open") {
		throw new Error("Challenges can only change before the Trial Cycle starts");
	}
}

export const list = query({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const { trial } = await requireTrialAsFounder(ctx, args.trialCycleId);
		return await listChallenges(ctx, trial._id);
	},
});

export const add = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		title: v.string(),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { trial, userId } = await requireTrialAsFounder(
			ctx,
			args.trialCycleId,
		);
		requireNotStarted(trial.status);
		requireChallengeRoom((await listChallenges(ctx, trial._id)).length + 1);

		return await ctx.db.insert("challenges", {
			trialCycleId: trial._id,
			startupId: trial.startupId,
			...buildChallengeFields(args),
			createdByUserId: userId,
		});
	},
});

export const remove = mutation({
	args: { challengeId: v.id("challenges") },
	handler: async (ctx, args) => {
		const challenge = await ctx.db.get(args.challengeId);
		if (!challenge) {
			throw new Error("Challenge not found");
		}
		const { trial } = await requireTrialAsFounder(ctx, challenge.trialCycleId);
		requireNotStarted(trial.status);
		await ctx.db.delete(challenge._id);
	},
});
