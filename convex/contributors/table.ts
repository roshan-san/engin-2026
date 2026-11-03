import { defineTable } from "convex/server";
import { v } from "convex/values";
import { discipline } from "../lib/disciplines";

export const contributorsTables = {
	contributors: defineTable({
		startupId: v.id("startups"),
		userId: v.id("users"),
		discipline,
		/** The person's own words for what they do here. Never changes permissions. */
		label: v.optional(v.string()),
	})
		.index("by_startup_and_user", ["startupId", "userId"])
		.index("by_user", ["userId"]),
};
