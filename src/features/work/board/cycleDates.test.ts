import { WEEK_MS, weekStart } from "@convex/shared/cycles";
import { describe, expect, it } from "vitest";
import { cycleDates } from "./cycleDates";

function datesOf(week: string) {
	const startsAt = weekStart(week);
	return cycleDates(startsAt, startsAt + WEEK_MS);
}

describe("cycleDates", () => {
	it("shows one month once when the week stays inside it", () => {
		expect(datesOf("2026-W42")).toBe("Oct 12 – 18");
	});

	it("shows both months when the week crosses a month", () => {
		expect(datesOf("2026-W40")).toBe("Sep 28 – Oct 4");
	});

	it("shows a week that starts the new year's first Monday", () => {
		expect(datesOf("2027-W01")).toBe("Jan 4 – 10");
	});
});
