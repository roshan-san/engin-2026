import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import {
	action,
	internalMutation,
	internalQuery,
	query,
} from "./_generated/server";
import { checkout, customerPortal } from "./billing/dodo";
import {
	hasPaymentIssue,
	productIdFor,
	subscriptionEvent,
	syncSubscription,
} from "./billing/model";
import { requireUserId } from "./lib/auth";
import { isSafeReturnPath } from "./lib/returnPath";
import { loadPlanView } from "./model/hackathons";
import { planKey } from "./shared/validators";

/** Every Dodo subscription webhook lands here. */
export const sync = internalMutation({
	args: subscriptionEvent,
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
		const latest = await ctx.db
			.query("subscriptions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.first();
		return latest?.dodoCustomerId ?? null;
	},
});

/** A Dodo checkout for a plan. Dodo sends the Founder back to `returnPath` on engin. */
export const startCheckout = action({
	args: { plan: planKey, returnPath: v.string() },
	handler: async (ctx, args): Promise<{ url: string }> => {
		const userId = await requireUserId(ctx);
		if (!isSafeReturnPath(args.returnPath)) {
			throw new ConvexError("Checkout can only return to engin");
		}
		const customer: { email: string | null; name: string | null } =
			await ctx.runQuery(internal.billing.checkoutCustomer, { userId });
		if (!customer.email) {
			throw new ConvexError("Your account has no email, so Dodo can't bill it");
		}

		const { checkout_url } = await checkout(ctx, {
			payload: {
				product_cart: [{ product_id: productIdFor(args.plan), quantity: 1 }],
				customer: { email: customer.email, name: customer.name ?? undefined },
				// The webhook finds the Founder by this.
				metadata: { userId },
				return_url: `${process.env.SITE_URL}${args.returnPath}`,
				// Event promo codes; Dodo decides what each code is worth.
				feature_flags: { allow_discount_code: true },
			},
		});
		return { url: checkout_url };
	},
});

/** Dodo's customer portal: cancel, switch plan, change card, invoices. */
export const openPortal = action({
	args: {},
	handler: async (ctx): Promise<{ url: string }> => {
		const userId = await requireUserId(ctx);
		const customerId: string | null = await ctx.runQuery(
			internal.billing.customerIdFor,
			{ userId },
		);
		if (!customerId) {
			throw new ConvexError("You don't have a plan yet.");
		}
		const { portal_url } = await customerPortal(ctx, { send_email: false });
		return { url: portal_url };
	},
});
