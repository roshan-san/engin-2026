import { describe, expect, it } from "vitest";
import { panelAfter, panelShows } from "./detailPanelState";

describe("panelShows", () => {
	it("on desktop the side panel shows the open item, else the page's own panel", () => {
		expect(
			panelShows({ isMobile: false, hasItem: true, isRequested: false }),
		).toEqual({ where: "side", what: "item" });
		expect(
			panelShows({ isMobile: false, hasItem: false, isRequested: false }),
		).toEqual({ where: "side", what: "default" });
	});

	it("on a phone the sheet opens only for an open item or when asked for", () => {
		expect(
			panelShows({ isMobile: true, hasItem: true, isRequested: false }),
		).toEqual({ where: "sheet", what: "item" });
		expect(
			panelShows({ isMobile: true, hasItem: false, isRequested: true }),
		).toEqual({ where: "sheet", what: "default" });
		expect(
			panelShows({ isMobile: true, hasItem: false, isRequested: false }),
		).toBeNull();
	});

	it("before the screen width is known, it shows nowhere", () => {
		expect(
			panelShows({ isMobile: undefined, hasItem: true, isRequested: true }),
		).toBeNull();
	});
});

describe("panelAfter", () => {
	const phoneWithCard = { isMobile: true, hasItem: true, isRequested: false };

	it("back on a phone leaves the item for the page's own panel in the sheet", () => {
		expect(panelShows(panelAfter("back", phoneWithCard))).toEqual({
			where: "sheet",
			what: "default",
		});
	});

	it("close on a phone shuts the sheet", () => {
		expect(panelShows(panelAfter("close", phoneWithCard))).toBeNull();
	});

	it("back on desktop returns the side panel to the page's own panel", () => {
		expect(
			panelShows(
				panelAfter("back", {
					isMobile: false,
					hasItem: true,
					isRequested: false,
				}),
			),
		).toEqual({ where: "side", what: "default" });
	});
});
