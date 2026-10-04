import { defineTable } from "convex/server";
import { v } from "convex/values";

/** Where a hackathon credit came from; decides spend order (eng review). */
export const creditSource = v.union(
	v.literal("launch"),
	v.literal("upi"),
	v.literal("rerun"),
	v.literal("pro_monthly"),
	v.literal("purchase"),
);

export const billingTables = {
	/**
	 * One row per hackathon credit, whatever it came from (eng review D2).
	 * A credit pays for publishing one Trial Cycle.
	 */
	hackathonCredits: defineTable({
		/** Unset until someone claims a launch or UPI code. */
		ownerUserId: v.optional(v.id("users")),
		source: creditSource,
		/** Launch and UPI codes, stored lowercase without spaces or dashes. */
		code: v.optional(v.string()),
		/** Who Engin handed a code to, e.g. "IIT-M E-cell session". */
		issuedTo: v.optional(v.string()),
		/**
		 * One credit per key, because webhooks repeat:
		 * `pro_monthly:{userId}:{YYYY-MM}`, `purchase:{paymentId}`, `rerun:{trialCycleId}`.
		 */
		grantKey: v.optional(v.string()),
		expiresAt: v.optional(v.number()),
		spentAt: v.optional(v.number()),
	})
		.index("by_owner_and_spent", ["ownerUserId", "spentAt"])
		.index("by_code", ["code"])
		.index("by_grant_key", ["grantKey"])
		.index("by_source", ["source"]),
};
