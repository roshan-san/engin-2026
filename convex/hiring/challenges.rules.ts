import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { CHALLENGE_TEXT_LIMITS, MAX_TRIAL_CHALLENGES } from "../lib/limits";
import { limitText, requireLimitedText } from "../lib/text";

export type ChallengeInput = { title: string; description?: string };

/** A Starting Pulse's text, trimmed and bounded. */
export function buildChallengeFields(item: ChallengeInput) {
	return {
		title: requireLimitedText(
			item.title,
			"Starting Pulse title",
			CHALLENGE_TEXT_LIMITS.title,
		),
		description: limitText(
			item.description,
			"Starting Pulse description",
			CHALLENGE_TEXT_LIMITS.description,
		),
	};
}

export function requireChallengeRoom(count: number): void {
	if (count > MAX_TRIAL_CHALLENGES) {
		throw new Error(
			`A hackathon can have at most ${MAX_TRIAL_CHALLENGES} Starting Pulses`,
		);
	}
}

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

/**
 * A draft's Starting Pulses become exactly `items`, in order. Safe to delete
 * and reinsert: nothing points at a Challenge row until the start copies it.
 */
export async function replaceChallenges(
	ctx: MutationCtx,
	trial: Pick<Doc<"trialCycles">, "_id" | "startupId">,
	items: ChallengeInput[],
	userId: Id<"users">,
): Promise<void> {
	requireChallengeRoom(items.length);
	const fields = items.map(buildChallengeFields);

	for (const challenge of await listChallenges(ctx, trial._id)) {
		await ctx.db.delete(challenge._id);
	}
	for (const field of fields) {
		await ctx.db.insert("challenges", {
			trialCycleId: trial._id,
			startupId: trial.startupId,
			...field,
			createdByUserId: userId,
		});
	}
}
