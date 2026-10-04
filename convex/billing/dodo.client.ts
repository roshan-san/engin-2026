import {
	DodoPayments,
	type DodoPaymentsClientConfig,
} from "@dodopayments/convex";
import { components } from "../_generated/api";

export type BillingInterval = "monthly" | "yearly";

export const dodo = new DodoPayments(components.dodopayments, {
	identify: async () => null,
	apiKey: process.env.DODO_PAYMENTS_API_KEY ?? "",
	environment: (process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode") as
		| "test_mode"
		| "live_mode",
} as DodoPaymentsClientConfig);

export const { checkout } = dodo.api();

export function getProductIdForInterval(interval: BillingInterval): string {
	const productId =
		interval === "yearly"
			? process.env.DODO_YEARLY_PLAN_ID
			: process.env.DODO_MONTHLY_PLAN_ID;

	if (!productId) {
		throw new Error(
			interval === "yearly"
				? "DODO_YEARLY_PLAN_ID is not configured"
				: "DODO_MONTHLY_PLAN_ID is not configured",
		);
	}

	return productId;
}

/** ₹2,999 on Free, ₹1,499 on Pro (design: Pricing). */
export function getHackathonProductId(planTier: "free" | "pro"): string {
	const productId =
		planTier === "pro"
			? process.env.DODO_HACKATHON_PRO_PRODUCT_ID
			: process.env.DODO_HACKATHON_PRODUCT_ID;

	if (!productId) {
		throw new Error(
			planTier === "pro"
				? "DODO_HACKATHON_PRO_PRODUCT_ID is not configured"
				: "DODO_HACKATHON_PRODUCT_ID is not configured",
		);
	}

	return productId;
}
