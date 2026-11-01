import { defineTable } from "convex/server";
import { v } from "convex/values";

export const conversationsTables = {
	/** One line per customer talk. Team-only, and outside Momentum. */
	conversations: defineTable({
		startupId: v.id("startups"),
		/** ISO week key, `YYYY-Www`. */
		week: v.string(),
		authorId: v.id("users"),
		line: v.string(),
	}).index("by_startup_and_week", ["startupId", "week"]),
};
