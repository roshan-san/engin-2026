import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, query } from "../_generated/server";
import { isProUser, requireUserId } from "../lib/auth";
import {
	type BillingInterval,
	checkout,
	getProductIdForInterval,
} from "./dodo.client";

export const getPlan = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const pro = await isProUser(ctx, userId);

		return {
			isPro: pro,
			planTier: pro ? ("pro" as const) : ("free" as const),
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

		const user = await ctx.runQuery(internal.people.users.getById, { userId });
		if (!user?.email) {
			throw new Error("Add an email to your account before upgrading");
		}

		const interval: BillingInterval = args.interval ?? "yearly";
		const productId = getProductIdForInterval(interval);

		const session = await checkout(ctx, {
			payload: {
				product_cart: [{ product_id: productId, quantity: 1 }],
				customer: {
					email: user.email,
					name: user.name ?? user.email,
				},
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
