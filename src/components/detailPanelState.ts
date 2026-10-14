export type PanelState = {
	/** `undefined` until the screen width is known. */
	readonly isMobile: boolean | undefined;
	/** Whether an item (a Card, an entry) is open. */
	readonly hasItem: boolean;
	/** Whether you asked for the page's own panel on a phone. */
	readonly isRequested: boolean;
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
}: PanelState): PanelShows {
	const what = hasItem ? "item" : "default";
	if (isMobile === undefined) {
		return null;
	}
	if (!isMobile) {
		return { where: "side", what };
	}
	return hasItem || isRequested ? { where: "sheet", what } : null;
}

/** The panel after back or close: both leave the item; back on a phone keeps the sheet open on the page's own panel. */
export function panelAfter(
	action: "back" | "close",
	state: PanelState,
): PanelState {
	return {
		isMobile: state.isMobile,
		hasItem: false,
		isRequested: action === "back" && state.isMobile === true,
	};
}
