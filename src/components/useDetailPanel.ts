import { useState } from "react";
import { panelAfter, panelShows } from "~/components/detailPanelState";
import { useIsMobile } from "~/lib/use-mobile";

/** The detail panel's state for a page whose open item lives in the URL. */
export function useDetailPanel(hasItem: boolean, clearItem: () => void) {
	const isMobile = useIsMobile();
	const [isRequested, setIsRequested] = useState(false);
	const state = { isMobile, hasItem, isRequested };

	function apply(action: "back" | "close") {
		setIsRequested(panelAfter(action, state).isRequested);
		if (hasItem) clearItem();
	}

	return {
		isMobile,
		shows: panelShows(state),
		/** Opens the page's own panel; on desktop it's already showing. */
		open: () => setIsRequested(true),
		back: () => apply("back"),
		close: () => apply("close"),
	};
}
