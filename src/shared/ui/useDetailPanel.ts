import { useState } from "react";
import { useIsMobile } from "~/shared/lib/useIsMobile";
import { panelAfter, panelShows } from "./detailPanelState";

/** The detail panel's state for a page whose open item lives in the URL. */
export function useDetailPanel(
	hasItem: boolean,
	clearItem: () => void,
	{ opensOnRequest = false }: { readonly opensOnRequest?: boolean } = {},
) {
	const isMobile = useIsMobile();
	const [isRequested, setIsRequested] = useState(false);
	const state = { isMobile, hasItem, isRequested, opensOnRequest };

	function apply(action: "back" | "close") {
		setIsRequested(panelAfter(action, state).isRequested);
		if (hasItem) clearItem();
	}

	return {
		isMobile,
		shows: panelShows(state),
		/** Opens the page's own panel; on desktop it's already showing. */
		open: () => setIsRequested(true),
		/** Opens or shuts the page's own panel. */
		toggle: () => setIsRequested((current) => !current),
		back: () => apply("back"),
		close: () => apply("close"),
	};
}
