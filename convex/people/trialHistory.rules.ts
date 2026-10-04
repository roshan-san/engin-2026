import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { isPassed } from "../hiring/trialCycles.rules";
import { MAX_USER_APPLICATIONS } from "../lib/limits";

/**
 * Public Trial Cycle history: Score-earning Verdicts with the Startup that
 * issued them, Evaluations the person chose to show, and Leaving.
 */
export async function loadTrialHistory(ctx: QueryCtx, userId: Id<"users">) {
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);

	const verdicts = [];
	const evaluations = [];
	const trialCyclesLeft = [];
	for (const application of applications) {
		const isScoredVerdict =
			application.status === "completed" &&
			isPassed(application.verdict) &&
			!application.scoreExcluded;
		const isShownEvaluation =
			application.evaluationPublic && application.evaluation;
		if (
			!isScoredVerdict &&
			!isShownEvaluation &&
			application.status !== "left"
		) {
			continue;
		}
		const trial = await ctx.db.get(application.trialCycleId);
		const startup = await ctx.db.get(application.startupId);
		const context = {
			trialTitle: trial?.title ?? "Trial Cycle",
			startupName: startup?.name ?? "Startup",
		};
		if (
			isScoredVerdict &&
			(application.verdict === "passed" ||
				application.verdict === "passed_with_offer")
		) {
			verdicts.push({
				...context,
				_id: application._id,
				startupSlug: startup?.isPublic ? startup.slug : null,
				verdict: application.verdict,
			});
		}
		if (isShownEvaluation && application.evaluation) {
			evaluations.push({
				...context,
				_id: application._id,
				verdict: application.verdict ?? null,
				evaluation: application.evaluation,
			});
		}
		if (application.status === "left") {
			trialCyclesLeft.push({ ...context, _id: application._id });
		}
	}

	return { verdicts, evaluations, trialCyclesLeft };
}
