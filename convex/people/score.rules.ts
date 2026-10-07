import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isPassed } from "../hiring/hackathons.rules";
import { MAX_USER_APPLICATIONS, MAX_USER_OFFERS } from "../lib/limits";
import { SCORE_WEIGHTS } from "./scoreWeights.rules";

/** Score and the Hackathon outcomes it is derived from (ADR 0002). */
export type ScoreEvidence = {
	score: number;
	hackathonsPassed: number;
	startups: number;
	teamConversions: number;
	hackathonsLeft: number;
};

function computeEnginScore(evidence: Omit<ScoreEvidence, "score">): number {
	return Math.max(
		0,
		evidence.hackathonsPassed * SCORE_WEIGHTS.passedVerdict +
			evidence.teamConversions * SCORE_WEIGHTS.acceptedOffer +
			evidence.hackathonsLeft * SCORE_WEIGHTS.leaving,
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

	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);

	const hackathonsLeft = applications.filter(
		(application) => application.status === "left",
	).length;

	const hackathonsPassed = applications.filter(
		(application) =>
			application.status === "completed" &&
			isPassed(application.verdict) &&
			!application.scoreExcluded,
	).length;

	const acceptedOffers = await ctx.db
		.query("offers")
		.withIndex("by_user_and_status", (q) =>
			q.eq("userId", userId).eq("status", "accepted"),
		)
		.take(MAX_USER_OFFERS);
	let teamConversions = 0;
	for (const offer of acceptedOffers) {
		const application = await ctx.db.get(offer.applicationId);
		if (!application?.scoreExcluded) {
			teamConversions += 1;
		}
	}

	const signals = {
		hackathonsPassed,
		startups: memberships.length,
		teamConversions,
		hackathonsLeft,
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
