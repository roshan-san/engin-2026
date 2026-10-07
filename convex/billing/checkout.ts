import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalMutation } from "../_generated/server";
import { requireIpTerms } from "../hiring/ipTerms.rules";
import { requirePublishable } from "../hiring/publish.rules";
import { HACKATHON_PAYMENT_KIND } from "./credits.rules";
import { checkout, getHackathonProductId } from "./dodo.client";

/**
 * Runs the publish checks before taking money, and records the Founder's IP
 * acknowledgment so the webhook can publish once the payment lands. The
 * product is picked before the stamp, so a missing product setting leaves
 * the draft untouched rather than looking like a checkout in progress.
 */
export const prepareHackathonCheckout = internalMutation({
	args: { userId: v.id("users"), hackathonId: v.id("hackathons") },
	handler: async (
		ctx,
		args,
	): Promise<{ email: string; name: string; productId: string }> => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			throw new Error("Hackathon not found");
		}
		const now = Date.now();
		await requirePublishable(ctx, hackathon, args.userId, now);

		const user = await ctx.db.get(args.userId);
		if (!user?.email) {
			throw new Error("Add an email to your account before paying");
		}
		const productId = getHackathonProductId(user.planTier ?? "free");
		await ctx.db.patch(hackathon._id, { ipAcknowledgedAt: now });

		return {
			email: user.email,
			name: user.name ?? user.email,
			productId,
		};
	},
});

export const createHackathonCheckout = action({
	args: {
		hackathonId: v.id("hackathons"),
		returnUrl: v.string(),
		acceptTerms: v.boolean(),
	},
	handler: async (ctx, args): Promise<{ checkoutUrl: string }> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}
		requireIpTerms(args.acceptTerms);

		const payer = await ctx.runMutation(
			internal.billing.checkout.prepareHackathonCheckout,
			{ userId, hackathonId: args.hackathonId },
		);
		const session = await checkout(ctx, {
			payload: {
				product_cart: [{ product_id: payer.productId, quantity: 1 }],
				customer: { email: payer.email, name: payer.name },
				return_url: args.returnUrl,
				billing_currency: "INR",
				metadata: {
					userId,
					kind: HACKATHON_PAYMENT_KIND,
					hackathonId: args.hackathonId,
				},
			},
		});

		if (!session?.checkout_url) {
			throw new Error("Checkout session did not return a checkout_url");
		}
		return { checkoutUrl: session.checkout_url };
	},
});
