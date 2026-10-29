import { api } from "@convex/_generated/api";
import type { PlanKey } from "@convex/shared/plans";
import { useAction } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Sends the browser to Dodo checkout. Failures are toasted and resolve to `false`. */
export function useCheckout() {
	const start = useAction(api.billing.checkout.start);

	async function checkout(plan: PlanKey, returnPath: string) {
		return attempt(async () => {
			const { url } = await start({ plan, returnPath });
			window.location.assign(url);
		});
	}

	return { checkout };
}
