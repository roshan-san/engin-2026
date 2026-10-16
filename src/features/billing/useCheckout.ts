import { api } from "@convex/_generated/api";
import type { PlanKey } from "@convex/shared/plans";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Sends the browser to Dodo checkout. Failures are toasted and resolve to `false`. */
export function useCheckout() {
	const start = useAction(api.billing.checkout.start);

	async function checkout(plan: PlanKey, returnPath: string) {
		try {
			const { url } = await start({ plan, returnPath });
			window.location.assign(url);
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { checkout };
}
