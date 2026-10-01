import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalMutation } from "../_generated/server";
import { checkout, getHackathonProductId } from "../dodo";
import { HACKATHON_PAYMENT_KIND } from "../lib/billing/credits";
import { requireIpTerms } from "../lib/hiring/ipTerms";
import { requirePublishable } from "../lib/hiring/publish";

/**
 * Runs the publish checks before taking money, and records the Founder's IP
 * acknowledgment so the webhook can publish once the payment lands.
 */
export const prepareHackathonCheckout = internalMutation({
	args: { userId: v.id("users"), trialCycleId: v.id("trialCycles") },
	handler: async (
		ctx,
		args,
	): Promise<{ email: string; name: string; planTier: "free" | "pro" }> => {
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		const now = Date.now();
		await requirePublishable(ctx, trial, args.userId, now);

		const user = await ctx.db.get(args.userId);
		if (!user?.email) {
			throw new Error("Add an email to your account before paying");
		}
		await ctx.db.patch(trial._id, { ipAcknowledgedAt: now });

		return {
			email: user.email,
			name: user.name ?? user.email,
			planTier: user.planTier ?? "free",
		};
	},
});

export const createHackathonCheckout = action({
	args: {
		trialCycleId: v.id("trialCycles"),
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
			{ userId, trialCycleId: args.trialCycleId },
		);
		const session = await checkout(ctx, {
			payload: {
				product_cart: [
					{ product_id: getHackathonProductId(payer.planTier), quantity: 1 },
				],
				customer: { email: payer.email, name: payer.name },
				return_url: args.returnUrl,
				billing_currency: "INR",
				metadata: {
					userId,
					kind: HACKATHON_PAYMENT_KIND,
					trialCycleId: args.trialCycleId,
				},
			},
		});

		if (!session?.checkout_url) {
			throw new Error("Checkout session did not return a checkout_url");
		}
		return { checkoutUrl: session.checkout_url };
	},
});
