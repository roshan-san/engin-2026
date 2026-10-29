import { describe, expect, it } from "vitest";
import { startOptions } from "./startOptions";

/** A moment in IST, as a timestamp. */
function ist(day: number, hour: number, minute = 0) {
	return Date.UTC(2026, 9, day, hour, minute) - 5.5 * 3600_000;
}

describe("startOptions", () => {
	it("midweek offers the next two Mondays", () => {
		expect(startOptions(ist(14, 12))).toEqual([
			{ label: "Next Monday", startsAt: ist(19, 0) },
			{ label: "Monday after", startsAt: ist(26, 0) },
		]);
	});

	it("on a Monday at midnight, that Monday has already started", () => {
		expect(startOptions(ist(19, 0))[0].startsAt).toBe(ist(26, 0));
	});

	it("late on Sunday, tomorrow is still next Monday", () => {
		expect(startOptions(ist(18, 23, 30))[0].startsAt).toBe(ist(19, 0));
	});
});
