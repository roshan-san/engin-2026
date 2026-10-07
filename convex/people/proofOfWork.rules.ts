import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_USER_TASKS } from "../lib/limits";

type WorkCounts = { verifiedTasks: number; cyclesCompleted: number };

/**
 * Internal work behind a profile: Verified Tasks, from team Cycles and
 * hackathons alike, and the closed team Cycles they shipped in. Visible
 * evidence only; it never changes Score (ADR 0002). Work at private Startups
 * is collapsed into one anonymous total.
 */
export async function loadProofOfWork(ctx: QueryCtx, userId: Id<"users">) {
	const assigned = await ctx.db
		.query("tasks")
		.withIndex("by_assignee", (q) => q.eq("assigneeUserId", userId))
		.take(MAX_USER_TASKS);

	const cyclesByStartup = new Map<Id<"startups">, Set<Id<"cycles">>>();
	const tasksByStartup = new Map<Id<"startups">, number>();
	for (const task of assigned) {
		if (task.status !== "done") {
			continue;
		}
		tasksByStartup.set(
			task.startupId,
			(tasksByStartup.get(task.startupId) ?? 0) + 1,
		);
		const cycle = await ctx.db.get(task.cycleId);
		if (cycle?.kind === "team" && cycle.status === "closed") {
			const cycles = cyclesByStartup.get(task.startupId) ?? new Set();
			cycles.add(cycle._id);
			cyclesByStartup.set(task.startupId, cycles);
		}
	}

	const startups = [];
	const privateWork = { startups: 0, verifiedTasks: 0, cyclesCompleted: 0 };
	for (const [startupId, verifiedTasks] of tasksByStartup) {
		const counts: WorkCounts = {
			verifiedTasks,
			cyclesCompleted: cyclesByStartup.get(startupId)?.size ?? 0,
		};
		const startup = await ctx.db.get(startupId);
		if (startup?.isPublic) {
			startups.push({
				startupId,
				name: startup.name,
				slug: startup.slug,
				...counts,
			});
			continue;
		}
		privateWork.startups += 1;
		privateWork.verifiedTasks += counts.verifiedTasks;
		privateWork.cyclesCompleted += counts.cyclesCompleted;
	}

	return { startups, private: privateWork };
}
