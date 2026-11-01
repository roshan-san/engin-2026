import { defineTable } from "convex/server";
import { v } from "convex/values";

export const cyclesTables = {
	cycleGoals: defineTable({
		startupId: v.id("startups"),
		/** ISO week key, `YYYY-Www`. */
		week: v.string(),
		/** Absent on a week that was reviewed without one. */
		goal: v.optional(v.string()),
		/** From the Monday review; only a week with a goal has it. */
		goalMet: v.optional(v.boolean()),
		reviewedAt: v.optional(v.number()),
	}).index("by_startup_and_week", ["startupId", "week"]),
};
