import { defineTable } from "convex/server";
import { v } from "convex/values";

export const pushTables = {
	/** One per browser or installed app that allowed notifications. */
	pushSubscriptions: defineTable({
		userId: v.id("users"),
		endpoint: v.string(),
		p256dh: v.string(),
		auth: v.string(),
	})
		.index("by_user", ["userId"])
		.index("by_endpoint", ["endpoint"]),
};
