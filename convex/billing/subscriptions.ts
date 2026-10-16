import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "../_generated/server";
import { requireUserId } from "../model/auth";
import {
	hasPaymentIssue,
	loadPlanView,
	syncSubscription,
} from "../model/billing";
import { MAX_USER_SUBSCRIPTIONS } from "../shared/limits";
import { subscriptionStatus } from "../shared/validators";

/** Every Dodo subscription webhook lands here. */
export const sync = internalMutation({
	args: {
		dodoSubscriptionId: v.string(),
		dodoCustomerId: v.string(),
		productId: v.string(),
		status: subscriptionStatus,
		periodStart: v.number(),
		periodEnd: v.number(),
		userId: v.optional(v.string()),
		eventAt: v.number(),
	},
	handler: async (ctx, args) => {
		await syncSubscription(ctx, args);
	},
});

/** Your plan and what's left of it; null without Pro. */
export const mine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		return await loadPlanView(ctx, userId);
	},
});

/** Whether your plan is on hold or paused after a failed payment, with no active one. */
export const paymentIssue = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		return await hasPaymentIssue(ctx, userId);
	},
});

/** Who checkout bills: the person's email and name. */
export const checkoutCustomer = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		return { email: user?.email ?? null, name: user?.name ?? null };
	},
});

/** The Dodo customer behind the person's latest subscription, for the customer portal. */
export const customerIdFor = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const subscriptions = await ctx.db
			.query("subscriptions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.take(MAX_USER_SUBSCRIPTIONS);
		return subscriptions[0]?.dodoCustomerId ?? null;
	},
});
