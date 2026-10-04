import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_TRIAL_CHALLENGES } from "../lib/limits";

export async function listChallenges(
	ctx: QueryCtx | MutationCtx,
	trialCycleId: Id<"trialCycles">,
) {
	return await ctx.db
		.query("challenges")
		.withIndex("by_trial", (q) => q.eq("trialCycleId", trialCycleId))
		.take(MAX_TRIAL_CHALLENGES);
}

/** The copy belongs to the Participant: editing the Challenge never changes it. */
async function copyChallengeToBoard(
	ctx: MutationCtx,
	challenge: Doc<"challenges">,
	participantUserId: Id<"users">,
): Promise<void> {
	await ctx.db.insert("pulses", {
		startupId: challenge.startupId,
		trialCycleId: challenge.trialCycleId,
		participantUserId,
		assigneeUserId: participantUserId,
		title: challenge.title,
		description: challenge.description,
		status: "todo",
		createdByUserId: challenge.createdByUserId,
	});
}

export async function seedBoards(
	ctx: MutationCtx,
	trialCycleId: Id<"trialCycles">,
	participantUserIds: Id<"users">[],
): Promise<void> {
	const challenges = await listChallenges(ctx, trialCycleId);
	for (const participantUserId of participantUserIds) {
		for (const challenge of challenges) {
			await copyChallengeToBoard(ctx, challenge, participantUserId);
		}
	}
}
