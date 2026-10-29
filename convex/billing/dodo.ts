import { getAuthUserId } from "@convex-dev/auth/server";
import { DodoPayments } from "@dodopayments/convex";
import { components, internal } from "../_generated/api";

// Explicit types: `internal` includes the actions that import this file, so inference would loop.
/** engin's Dodo account. The customer portal finds the signed-in Founder by their latest subscription. */
const dodo: DodoPayments = new DodoPayments(components.dodopayments, {
	identify: async (ctx): Promise<{ dodoCustomerId: string } | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const dodoCustomerId: string | null = await ctx.runQuery(
			internal.billing.customerIdFor,
			{ userId },
		);
		return dodoCustomerId ? { dodoCustomerId } : null;
	},
	apiKey: process.env.DODO_PAYMENTS_API_KEY ?? "",
	environment:
		process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
			? "live_mode"
			: "test_mode",
});

export const { checkout, customerPortal } = dodo.api();
