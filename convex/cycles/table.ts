import { defineTable } from "convex/server";
import { v } from "convex/values";

export const cyclesTables = {
	/** A team's week: when the Founder started it, and who is off. */
	cycleWeeks: defineTable({
		startupId: v.id("startups"),
		/** ISO week key, `YYYY-Www`. */
		week: v.string(),
		startedAt: v.optional(v.number()),
		offUserIds: v.array(v.id("users")),
	}).index("by_startup_and_week", ["startupId", "week"]),
};
