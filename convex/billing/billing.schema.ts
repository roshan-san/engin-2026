import { defineTable } from "convex/server";
import { v } from "convex/values";

/** Where a hackathon credit came from; decides spend order. */
export const creditSource = v.union(
	v.literal("pro_monthly"),
	v.literal("signup"),
	v.literal("rerun"),
	v.literal("purchase"),
);

export const billingTables = {
	/**
	 * One row per hackathon credit, whatever it came from (eng review D2).
	 * A credit pays for publishing one Trial Cycle.
	 */
	hackathonCredits: defineTable({
		ownerUserId: v.id("users"),
		source: creditSource,
		/**
		 * One credit per key, because grants repeat:
		 * `signup:{userId}`, `purchase:{paymentId}`, `rerun:{trialCycleId}`,
		 * `pro_monthly:{userId}:{proStartedAt}:{month}:{1|2}`.
		 */
		grantKey: v.optional(v.string()),
		expiresAt: v.optional(v.number()),
		spentAt: v.optional(v.number()),
	})
		.index("by_owner_and_spent", ["ownerUserId", "spentAt"])
		.index("by_grant_key", ["grantKey"]),
};
