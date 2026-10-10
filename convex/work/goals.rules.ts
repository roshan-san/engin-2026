import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { TEXT } from "../lib/limits";
import { requireLimitedText } from "../lib/text";

async function loadGoalRow(
	ctx: QueryCtx | MutationCtx,
	startupId: Id<"startups">,
	week: string,
): Promise<Doc<"cycleGoals"> | null> {
	return await ctx.db
		.query("cycleGoals")
		.withIndex("by_startup_and_week", (q) =>
			q.eq("startupId", startupId).eq("week", week),
		)
		.first();
}

/** The Founder's goal for the week, or null when none is set. */
export async function loadGoal(
	ctx: QueryCtx | MutationCtx,
	startupId: Id<"startups">,
	week: string,
): Promise<string | null> {
	return (await loadGoalRow(ctx, startupId, week))?.goal ?? null;
}

/** Sets the week's goal; a blank goal clears it. */
export async function saveGoal(
	ctx: MutationCtx,
	startupId: Id<"startups">,
	week: string,
	goal: string,
): Promise<void> {
	const existing = await loadGoalRow(ctx, startupId, week);
	if (!goal.trim()) {
		if (existing) {
			await ctx.db.delete(existing._id);
		}
		return;
	}
	const text = requireLimitedText(goal, "Goal", TEXT.goal);
	if (existing) {
		await ctx.db.patch(existing._id, { goal: text });
		return;
	}
	await ctx.db.insert("cycleGoals", { startupId, week, goal: text });
}
