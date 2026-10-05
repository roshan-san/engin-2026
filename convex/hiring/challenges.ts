import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import {
	type MutationCtx,
	mutation,
	type QueryCtx,
	query,
} from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import {
	announceChallengeChange,
	buildChallengeFields,
	listChallenges,
	listCurrentParticipantIds,
	requireChallengeRoom,
	requireChallengesEditable,
	seedChallenge,
} from "./challenges.rules";

async function requireTrial(
	ctx: QueryCtx | MutationCtx,
	trialCycleId: Id<"trialCycles">,
) {
	const trial = await ctx.db.get(trialCycleId);
	if (!trial) {
		throw new Error("Trial Cycle not found");
	}
	return trial;
}

async function requireTrialAsFounder(
	ctx: QueryCtx | MutationCtx,
	trialCycleId: Id<"trialCycles">,
) {
	const userId = await requireUserId(ctx);
	const trial = await requireTrial(ctx, trialCycleId);
	await requireFounderMembership(ctx, trial.startupId, userId);
	return { trial, userId };
}

export const list = query({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await requireTrial(ctx, args.trialCycleId);
		await requireMembership(ctx, trial.startupId, userId);
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
		requireChallengesEditable(trial);
		requireChallengeRoom((await listChallenges(ctx, trial._id)).length + 1);

		const challengeId = await ctx.db.insert("challenges", {
			trialCycleId: trial._id,
			startupId: trial.startupId,
			...buildChallengeFields(args),
			createdByUserId: userId,
		});

		const participantIds = await listCurrentParticipantIds(ctx, trial);
		if (participantIds.length > 0) {
			const challenge = await ctx.db.get(challengeId);
			if (challenge) {
				await seedChallenge(ctx, challenge, participantIds);
				await announceChallengeChange(
					ctx,
					trial,
					participantIds,
					`New Challenge in ${trial.title}: ${challenge.title}`,
					"trial_challenge_added",
				);
			}
		}

		return challengeId;
	},
});

/** Participants keep their copies: the work on a Board belongs to them. */
export const remove = mutation({
	args: { challengeId: v.id("challenges") },
	handler: async (ctx, args) => {
		const challenge = await ctx.db.get(args.challengeId);
		if (!challenge) {
			throw new Error("Challenge not found");
		}
		const { trial } = await requireTrialAsFounder(ctx, challenge.trialCycleId);
		requireChallengesEditable(trial);

		await ctx.db.delete(challenge._id);

		const participantIds = await listCurrentParticipantIds(ctx, trial);
		if (participantIds.length > 0) {
			await announceChallengeChange(
				ctx,
				trial,
				participantIds,
				`Challenge removed from ${trial.title}: ${challenge.title}`,
				"trial_challenge_removed",
			);
		}
	},
});
