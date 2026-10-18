import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { useState } from "react";
import { attempt } from "~/lib/errors";

/**
 * Sends the browser to Dodo's customer portal. `isOpening` stays on until the page leaves,
 * and turns off only when opening fails; failures are toasted.
 */
export function usePortal() {
	const open = useAction(api.billing.portal.open);
	const [isOpening, setIsOpening] = useState(false);

	async function openPortal() {
		setIsOpening(true);
		const isOpened = await attempt(async () => {
			const { url } = await open({});
			window.location.assign(url);
		});
		if (!isOpened) setIsOpening(false);
	}

	return { openPortal, isOpening };
}
