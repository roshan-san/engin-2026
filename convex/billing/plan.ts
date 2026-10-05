import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalQuery, query } from "../_generated/server";
import { isProUser, requireUserId } from "../lib/auth";
import {
	type BillingInterval,
	checkout,
	getProductIdForInterval,
} from "./dodo.client";
import { loadProUpgradeBlock, requireProUpgradable } from "./plan.rules";

export const getPlan = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const pro = await isProUser(ctx, userId);

		return {
			isPro: pro,
			planTier: pro ? ("pro" as const) : ("free" as const),
			canUpgrade: (await loadProUpgradeBlock(ctx, userId)) === null,
		};
	},
});

export const createCheckoutLink = action({
	args: {
		returnUrl: v.string(),
		interval: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
	},
	handler: async (ctx, args): Promise<{ checkoutUrl: string }> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const buyer = await ctx.runQuery(internal.billing.plan.prepareProCheckout, {
			userId,
		});

		const interval: BillingInterval = args.interval ?? "yearly";
		const productId = getProductIdForInterval(interval);

		const session = await checkout(ctx, {
			payload: {
				product_cart: [{ product_id: productId, quantity: 1 }],
				customer: buyer,
				return_url: args.returnUrl,
				billing_currency: "INR",
				metadata: {
					userId,
					interval,
				},
			},
		});

		if (!session?.checkout_url) {
			throw new Error("Checkout session did not return a checkout_url");
		}

		return { checkoutUrl: session.checkout_url };
	},
});

/** Runs the Pro checks before any checkout session is created. */
export const prepareProCheckout = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args): Promise<{ email: string; name: string }> =>
		await requireProUpgradable(ctx, args.userId),
});
