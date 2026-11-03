import { describe, expect, it } from "vitest";
import { floorToMinute } from "./minute";

describe("floorToMinute", () => {
	it("drops the seconds, so a minute's queries share one argument", () => {
		expect(floorToMinute(Date.parse("2026-11-06T11:30:59.999Z"))).toBe(
			Date.parse("2026-11-06T11:30:00Z"),
		);
		expect(floorToMinute(Date.parse("2026-11-06T11:30:00Z"))).toBe(
			Date.parse("2026-11-06T11:30:00Z"),
		);
	});
});
