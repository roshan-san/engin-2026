import { hackathonDates } from "@convex/hackathons/rules";
import { describe, expect, it } from "vitest";
import { dayLabel } from "./dates";
import { buildDaysLabel, lastDay } from "./hackathonDates";

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

	it("the build days run Monday to the last Sunday", () => {
		expect(buildDaysLabel(ist(12, 0), ist(19, 0))).toBe(
			"Mon, Oct 12 – Sun, Oct 18",
		);
	});

	it("decisions are due a week after the end", () => {
		const { endsAt, decideBy } = hackathonDates(ist(12, 0), 2);

		expect(dayLabel(lastDay(endsAt))).toBe("Sun, Oct 25");
		expect(dayLabel(lastDay(decideBy))).toBe("Sun, Nov 1");
	});
});
