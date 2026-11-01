export type PanelState = {
	/** `undefined` until the screen width is known. */
	readonly isMobile: boolean | undefined;
	/** Whether an item (a Card, an entry) is open. */
	readonly hasItem: boolean;
	/** Whether you asked for the page's own panel on a phone. */
	readonly isRequested: boolean;
	/** On desktop too, the page's own panel waits to be asked for. */
	readonly opensOnRequest?: boolean;
};

export type PanelShows = {
	readonly where: "side" | "sheet";
	readonly what: "item" | "default";
} | null;

/** Where the detail panel shows, and what: the open item, else the page's own panel. */
export function panelShows({
	isMobile,
	hasItem,
	isRequested,
	opensOnRequest = false,
}: PanelState): PanelShows {
	const what = hasItem ? "item" : "default";
	if (isMobile === undefined) {
		return null;
	}
	if (!isMobile) {
		return hasItem || isRequested || !opensOnRequest
			? { where: "side", what }
			: null;
	}
	return hasItem || isRequested ? { where: "sheet", what } : null;
}

/** The panel after back or close: both leave the item; back keeps the page's own panel showing where it would otherwise shut. */
export function panelAfter(
	action: "back" | "close",
	state: PanelState,
): PanelState {
	return {
		...state,
		hasItem: false,
		isRequested:
			action === "back" &&
			(state.isMobile === true || state.opensOnRequest === true),
	};
}
