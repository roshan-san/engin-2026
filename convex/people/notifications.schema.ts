import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notificationKind = v.union(
	v.literal("invite"),
	v.literal("pulse"),
	v.literal("cycle"),
	v.literal("trial_cycle"),
	v.literal("application"),
	v.literal("message"),
	v.literal("billing"),
	v.literal("offer"),
);

export const notificationsTables = {
	notifications: defineTable({
		userId: v.id("users"),
		kind: notificationKind,
		title: v.string(),
		body: v.optional(v.string()),
		href: v.optional(v.string()),
		readAt: v.optional(v.number()),
	}).index("by_user", ["userId"]),
};
