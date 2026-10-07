import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { isPassed } from "../hiring/hackathons.rules";
import { MAX_USER_APPLICATIONS } from "../lib/limits";

/**
 * Public Hackathon history, newest first: Passed Verdicts with the Startup
 * that issued them, any Verdict whose Evaluation the person chose to show, and
 * Leaving. Evaluation text only leaves the backend when it is public.
 */
export async function loadHackathonHistory(ctx: QueryCtx, userId: Id<"users">) {
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.order("desc")
		.take(MAX_USER_APPLICATIONS);

	const hackathonHistory = [];
	for (const application of applications) {
		const isPassedVerdict =
			application.status === "completed" && isPassed(application.verdict);
		const evaluation =
			application.evaluationPublic && application.evaluation
				? application.evaluation
				: null;
		const outcome =
			application.status === "left" ? ("left" as const) : application.verdict;
		if (!outcome || (!isPassedVerdict && !evaluation && outcome !== "left")) {
			continue;
		}

		const hackathon = await ctx.db.get(application.hackathonId);
		const startup = await ctx.db.get(application.startupId);
		hackathonHistory.push({
			_id: application._id,
			hackathonTitle: hackathon?.title ?? "Hackathon",
			startupName: startup?.name ?? "Startup",
			startupSlug: startup?.isPublic ? startup.slug : null,
			outcome,
			earnsScore: isPassedVerdict && !application.scoreExcluded,
			evaluation,
		});
	}

	return hackathonHistory;
}
