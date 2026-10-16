import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Sends the browser to Dodo's customer portal. Failures are toasted and resolve to `false`. */
export function usePortal() {
	const open = useAction(api.billing.portal.open);

	async function openPortal() {
		try {
			const { url } = await open({});
			window.location.assign(url);
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { openPortal };
}
