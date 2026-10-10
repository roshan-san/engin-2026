import { describe, expect, it } from "vitest";
import { DAY } from "../lib/testing.helpers";
import { cycleNumber, weekOf, weekStart } from "./cycles.rules";

describe("cycles", () => {
	it("weeks run Monday to Sunday in IST", () => {
		expect(weekOf(Date.parse("2026-10-18T18:29:00Z"))).toBe("2026-W42");
		expect(weekOf(Date.parse("2026-10-18T18:30:00Z"))).toBe("2026-W43");
		expect(weekStart("2026-W43")).toBe(Date.parse("2026-10-18T18:30:00Z"));
	});

	it("a year boundary uses ISO weeks", () => {
		expect(weekOf(Date.parse("2026-12-31T12:00:00Z"))).toBe("2026-W53");
		expect(weekOf(Date.parse("2027-01-03T12:00:00Z"))).toBe("2026-W53");
		expect(weekOf(Date.parse("2027-01-04T12:00:00Z"))).toBe("2027-W01");
		expect(weekStart("2027-W01")).toBe(Date.parse("2027-01-03T18:30:00Z"));
	});

	it("the first Cycle is the signup week", () => {
		const created = Date.parse("2026-10-14T09:00:00Z");

		expect(cycleNumber(created, created)).toBe(1);
		expect(cycleNumber(created, created + 7 * DAY)).toBe(2);
		expect(cycleNumber(created, created + 21 * DAY)).toBe(4);
	});
});
