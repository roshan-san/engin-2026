import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { isSafeReturnPath } from "../lib/returnPath";
import { productIdFor } from "../model/billing";
import { checkout } from "../model/dodo";
import { planKey } from "../shared/validators";

/** A Dodo checkout for a plan. Dodo sends the Founder back to `returnPath` on engin. */
export const start = action({
	args: { plan: planKey, returnPath: v.string() },
	handler: async (ctx, args): Promise<{ url: string }> => {
		const userId = await requireUserId(ctx);
		if (!isSafeReturnPath(args.returnPath)) {
			throw new ConvexError("Checkout can only return to engin");
		}
		const customer = await ctx.runQuery(
			internal.billing.subscriptions.checkoutCustomer,
			{ userId },
		);
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
