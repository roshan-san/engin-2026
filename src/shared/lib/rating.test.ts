import { weekStart } from "@convex/shared/cycles";
import { WEEK_COUNT_CAP } from "@convex/shared/limits";
import { describe, expect, it } from "vitest";
import { ratingChangeLabel, stripLevel, stripTooltip } from "./rating";

describe("rating", () => {
	it("a Rating change reads as a quiet arrow", () => {
		expect(ratingChangeLabel(12)).toEqual({ text: "▲ 12", direction: "up" });
		expect(ratingChangeLabel(-8)).toEqual({ text: "▼ 8", direction: "down" });
		expect(ratingChangeLabel(0)).toEqual({ text: "", direction: "flat" });
	});

	it("the strip shades by count, blank before Engin", () => {
		expect([null, 0, 1, 3, 5, 9].map(stripLevel)).toEqual([
			null,
			0,
			1,
			2,
			3,
			4,
		]);
	});

	it("a strip cell names its week and count", () => {
		const startsAt = weekStart("2026-W42");

		expect(stripTooltip({ startsAt, count: 3 })).toBe(
			"Oct 12 – 18 · 3 verified",
		);
		expect(stripTooltip({ startsAt, count: WEEK_COUNT_CAP })).toBe(
			"Oct 12 – 18 · 50+ verified",
		);
		expect(stripTooltip({ startsAt, count: null })).toBe("Before Engin");
	});
});
