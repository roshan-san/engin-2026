import { defineTable } from "convex/server";
import { v } from "convex/values";

import { planKey, subscriptionStatus } from "./rules";

export const billingTables = {
	/** A copy of a Dodo subscription, kept in sync by Dodo's webhooks. Dodo is the source of truth. */
	subscriptions: defineTable({
		/** The Founder who pays. One plan covers every Startup they found. */
		userId: v.id("users"),
		dodoSubscriptionId: v.string(),
		dodoCustomerId: v.string(),
		plan: planKey,
		status: subscriptionStatus,
		/** Start of the current billing period (Dodo's `previous_billing_date`). */
		periodStart: v.number(),
		/** When the next payment is due (Dodo's `next_billing_date`). */
		periodEnd: v.number(),
		/** Time of the Dodo event last applied, so an older event can't overwrite a newer one. */
		syncedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_dodo_subscription", ["dodoSubscriptionId"]),
};
