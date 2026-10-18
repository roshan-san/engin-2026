import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/**
 * Sends the browser to Dodo's customer portal. `isOpening` stays on until the page leaves,
 * and turns off only when opening fails; failures are toasted.
 */
export function usePortal() {
	const open = useAction(api.billing.portal.open);
	const [isOpening, setIsOpening] = useState(false);

	async function openPortal() {
		setIsOpening(true);
		try {
			const { url } = await open({});
			window.location.assign(url);
		} catch (error) {
			toast.error(errorMessage(error));
			setIsOpening(false);
		}
	}

	return { openPortal, isOpening };
}
