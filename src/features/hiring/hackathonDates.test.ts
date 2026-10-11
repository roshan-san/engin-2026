import { describe, expect, it } from "vitest";
import { dayLabel, lastDay } from "./hackathonDates";

/** A moment in IST, as a timestamp. */
function ist(day: number, hour: number) {
	return Date.UTC(2026, 9, day, hour) - 5.5 * 3600_000;
}

describe("hackathon dates", () => {
	it("a day reads as weekday, month and date in IST", () => {
		expect(dayLabel(ist(20, 0))).toBe("Tue, Oct 20");
	});

	it("an end at Monday midnight is the Sunday before", () => {
		expect(dayLabel(lastDay(ist(26, 0)))).toBe("Sun, Oct 25");
	});
});
