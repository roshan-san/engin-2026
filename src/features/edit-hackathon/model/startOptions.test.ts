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

	it("late on Sunday, tomorrow is too soon", () => {
		expect(startOptions(ist(18, 23, 30))).toEqual([
			{ label: "Monday after", startsAt: ist(26, 0) },
			{ label: "In 2 weeks", startsAt: ist(33, 0) },
		]);
	});

	it("Friday just after midnight skips next Monday", () => {
		expect(startOptions(ist(16, 0, 1))).toEqual([
			{ label: "Monday after", startsAt: ist(26, 0) },
			{ label: "In 2 weeks", startsAt: ist(33, 0) },
		]);
	});

	it("Thursday still offers next Monday", () => {
		expect(startOptions(ist(15, 23, 59))[0]).toEqual({
			label: "Next Monday",
			startsAt: ist(19, 0),
		});
	});

	it("an open post's saved start stays on offer though it's under 3 days away", () => {
		expect(startOptions(ist(17, 12), ist(19, 0))).toEqual([
			{ label: "Next Monday", startsAt: ist(19, 0) },
			{ label: "Monday after", startsAt: ist(26, 0) },
			{ label: "In 2 weeks", startsAt: ist(33, 0) },
		]);
	});

	it("a saved start already offered isn't offered twice", () => {
		expect(startOptions(ist(14, 12), ist(19, 0))).toHaveLength(2);
	});
});
