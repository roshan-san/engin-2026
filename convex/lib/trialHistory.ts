import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_USER_APPLICATIONS } from "./limits";

/** Public Trial Cycle history: Evaluations the person chose to show, and Leaving. */
export async function loadTrialHistory(ctx: QueryCtx, userId: Id<"users">) {
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);

	const evaluations = [];
	const trialCyclesLeft = [];
	for (const application of applications) {
		const isShownEvaluation =
			application.evaluationPublic && application.evaluation;
		if (!isShownEvaluation && application.status !== "left") {
			continue;
		}
		const trial = await ctx.db.get(application.trialCycleId);
		const startup = await ctx.db.get(application.startupId);
		const context = {
			trialTitle: trial?.title ?? "Trial Cycle",
			startupName: startup?.name ?? "Startup",
		};
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

	return { evaluations, trialCyclesLeft };
}
