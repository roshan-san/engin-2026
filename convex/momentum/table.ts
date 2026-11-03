import { defineTable } from "convex/server";
import { v } from "convex/values";
import { trustLevel } from "./rules";

export const momentumTables = {
	/** One per approved Card with an owner, freezing what it can be worth at approval time. */
	approvals: defineTable({
		ownerId: v.id("users"),
		approverId: v.id("users"),
		startupId: v.id("startups"),
		hackathonId: v.optional(v.id("hackathons")),
		cardId: v.id("cards"),
		week: v.string(),
		self: v.boolean(),
		/** Approved under INSTANT_MS after the Card was made. */
		instant: v.boolean(),
		/** The approver's Trust as of the last weekly run. */
		approverTrust: trustLevel,
	})
		.index("by_owner_and_week", ["ownerId", "week"])
		.index("by_approver_and_owner", ["approverId", "ownerId"])
		.index("by_startup_and_owner_and_week", ["startupId", "ownerId", "week"]),
	/** A week the person submitted their own Card or had one approved. */
	activeWeeks: defineTable({
		userId: v.id("users"),
		week: v.string(),
	}).index("by_user_and_week", ["userId", "week"]),
	/** Each weekly result and its inputs, per person or startup, for audit and the profile. */
	scoreEvents: defineTable({
		userId: v.optional(v.id("users")),
		startupId: v.optional(v.id("startups")),
		week: v.string(),
		momentum: v.number(),
		trust: trustLevel,
		activeWeeks: v.optional(v.number()),
		shippedWeeks: v.optional(v.number()),
		consistency: v.optional(v.number()),
		outcomes: v.optional(v.number()),
		credit: v.optional(v.number()),
	})
		.index("by_user_and_week", ["userId", "week"])
		.index("by_startup_and_week", ["startupId", "week"]),
};
