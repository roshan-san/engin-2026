import { describe, expect, it } from "vitest";
import { tierOf } from "./tiers";

describe("tierOf", () => {
	it("a Rating under 1000 is Tier 1", () => {
		expect(tierOf(0)).toBe(1);
		expect(tierOf(999)).toBe(1);
	});

	it("1000 to 1149 is Tier 2", () => {
		expect(tierOf(1000)).toBe(2);
		expect(tierOf(1149)).toBe(2);
	});

	it("1150 to 1299 is Tier 3", () => {
		expect(tierOf(1150)).toBe(3);
		expect(tierOf(1299)).toBe(3);
	});

	it("1300 to 1449 is Tier 4", () => {
		expect(tierOf(1300)).toBe(4);
		expect(tierOf(1449)).toBe(4);
	});

	it("1450 and up is Tier 5", () => {
		expect(tierOf(1450)).toBe(5);
		expect(tierOf(2400)).toBe(5);
	});

	it("a fractional Rating takes the band it falls in", () => {
		expect(tierOf(1149.6)).toBe(2);
	});
});
