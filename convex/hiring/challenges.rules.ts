import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { CHALLENGE_TEXT_LIMITS, MAX_TRIAL_CHALLENGES } from "../lib/limits";
import { trialCycleHref } from "../lib/links";
import { limitText, requireLimitedText } from "../lib/text";
import { notify } from "../people/notifications.rules";
import { logActivity } from "../teams/activity.rules";
import { listTrialApplications } from "./trialCycles.rules";

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

/**
 * Challenges change while the hackathon is a draft, open or running; once
 * running, changes reach every current Participant's Board.
 */
export function requireChallengesEditable(trial: Doc<"trialCycles">): void {
	if (
		trial.status !== "draft" &&
		trial.status !== "open" &&
		trial.status !== "active"
	) {
		throw new Error("Challenges can't change after the Trial Cycle ends");
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

/** Gives each Participant their own copy of one Challenge, e.g. one added mid-trial. */
export async function seedChallenge(
	ctx: MutationCtx,
	challenge: Doc<"challenges">,
	participantUserIds: Id<"users">[],
): Promise<void> {
	for (const participantUserId of participantUserIds) {
		await copyChallengeToBoard(ctx, challenge, participantUserId);
	}
}

export async function seedBoards(
	ctx: MutationCtx,
	trialCycleId: Id<"trialCycles">,
	participantUserIds: Id<"users">[],
): Promise<void> {
	for (const challenge of await listChallenges(ctx, trialCycleId)) {
		await seedChallenge(ctx, challenge, participantUserIds);
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

/** Mid-trial changes reach whoever is in now: Participants who left are out. */
export async function listCurrentParticipantIds(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
): Promise<Id<"users">[]> {
	if (trial.status !== "active") {
		return [];
	}
	const applications = await listTrialApplications(ctx, trial._id);
	return applications
		.filter((application) => application.status === "joined")
		.map((application) => application.userId);
}

/** Tells each current Participant and logs it for the Startup. */
export async function announceChallengeChange(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	participantIds: Id<"users">[],
	title: string,
	kind: "trial_challenge_added" | "trial_challenge_removed",
) {
	const href = await trialCycleHref(ctx, trial);
	for (const userId of participantIds) {
		await notify(ctx, { userId, kind: "trial_cycle", title, href });
	}
	await logActivity(ctx, {
		startupId: trial.startupId,
		kind,
		trialCycleId: trial._id,
		summary: title,
	});
}
