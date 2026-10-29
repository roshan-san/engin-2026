import { defineTable } from "convex/server";
import { v } from "convex/values";

export const cyclesTables = {
	cycleGoals: defineTable({
		startupId: v.id("startups"),
		/** ISO week key, `YYYY-Www`. */
		week: v.string(),
		goal: v.string(),
	}).index("by_startup_and_week", ["startupId", "week"]),
};
