import { api } from "@convex/_generated/api";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export type BillingInterval = "monthly" | "yearly";

export function useUpgrade() {
	const { isAuthenticated } = useConvexAuth();
	const plan = useQuery(
		api.billing.plan.getPlan,
		isAuthenticated ? {} : "skip",
	);
	const createCheckout = useAction(api.billing.plan.createCheckoutLink);
	const [isLoading, setIsLoading] = useState(false);

	async function upgrade(interval: BillingInterval = "yearly") {
		if (!isAuthenticated) {
			toast.error("Sign in to upgrade");
			return;
		}

		setIsLoading(true);
		try {
			const result = await createCheckout({
				returnUrl: `${window.location.origin}/my-pulses`,
				interval,
			});
			window.location.href = result.checkoutUrl;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Checkout failed");
		} finally {
			setIsLoading(false);
		}
	}

	return {
		isAuthenticated,
		plan,
		isLoading,
		upgrade,
	};
}
