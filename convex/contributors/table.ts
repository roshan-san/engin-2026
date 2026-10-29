import { defineTable } from "convex/server";
import { v } from "convex/values";

export const contributorsTables = {
	contributors: defineTable({
		startupId: v.id("startups"),
		userId: v.id("users"),
	})
		.index("by_startup_and_user", ["startupId", "userId"])
		.index("by_user", ["userId"]),
};
