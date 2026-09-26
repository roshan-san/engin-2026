import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_USER_APPLICATIONS, MAX_USER_OFFERS } from "./limits";
import { SCORE_WEIGHTS } from "./scoreWeights";
import { isPassed } from "./trials";

export type ScoreEvidence = {
	score: number;
	trialCyclesPassed: number;
	verifiedPulses: number;
	startups: number;
	completionRate: number | null;
	teamConversions: number;
	trialCyclesLeft: number;
};

export function computeEnginScore(
	evidence: Omit<ScoreEvidence, "score">,
): number {
	return Math.max(
		0,
		evidence.trialCyclesPassed * SCORE_WEIGHTS.passedVerdict +
			evidence.verifiedPulses * SCORE_WEIGHTS.verifiedPulse +
			evidence.teamConversions * SCORE_WEIGHTS.acceptedOffer +
			evidence.trialCyclesLeft * SCORE_WEIGHTS.leaving,
	);
}

export async function loadScoreEvidence(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
): Promise<ScoreEvidence> {
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(50);

	const assigned = await ctx.db
		.query("pulses")
		.withIndex("by_assignee", (q) => q.eq("assigneeUserId", userId))
		.take(100);

	const trialPulses = assigned.filter((pulse) => pulse.trialCycleId);
	const verifiedPulses = trialPulses.filter(
		(pulse) => pulse.status === "done",
	).length;
	const completionRate =
		trialPulses.length === 0 ? null : verifiedPulses / trialPulses.length;

	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);

	const trialCyclesLeft = applications.filter(
		(application) => application.status === "left",
	).length;

	const trialCyclesPassed = applications.filter(
		(application) =>
			application.status === "completed" && isPassed(application.verdict),
	).length;

	const acceptedOffers = await ctx.db
		.query("offers")
		.withIndex("by_user_and_status", (q) =>
			q.eq("userId", userId).eq("status", "accepted"),
		)
		.take(MAX_USER_OFFERS);
	const teamConversions = acceptedOffers.length;

	const signals = {
		trialCyclesPassed,
		verifiedPulses,
		startups: memberships.length,
		completionRate,
		teamConversions,
		trialCyclesLeft,
	};

	return {
		...signals,
		score: computeEnginScore(signals),
	};
}

export async function refreshUserScore(
	ctx: MutationCtx,
	userId: Id<"users">,
): Promise<number> {
	const evidence = await loadScoreEvidence(ctx, userId);
	await ctx.db.patch(userId, { score: evidence.score });
	return evidence.score;
}
