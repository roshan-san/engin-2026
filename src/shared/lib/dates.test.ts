import { WEEK_MS, weekStart } from "@convex/cycles/rules";
import { describe, expect, it } from "vitest";
import { dateRange, hourOfDay, relativeTime } from "./dates";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** An IST wall-clock time, as a timestamp. */
function ist(date: string, time: string) {
	return Date.parse(`${date}T${time}:00+05:30`);
}

describe("relativeTime", () => {
	const now = ist("2026-10-11", "12:00");

	it("says just now within the first minute", () => {
		expect(relativeTime(now - 30_000, now)).toBe("just now");
	});

	it("counts minutes", () => {
		expect(relativeTime(now - 2 * MINUTE, now)).toBe("2m ago");
	});

	it("counts hours", () => {
		expect(relativeTime(now - 3 * HOUR, now)).toBe("3h ago");
	});

	it("names the weekday within the last week, in IST", () => {
		expect(relativeTime(ist("2026-10-06", "10:00"), now)).toBe("Tue");
	});

	it("names the date once a week has passed, in IST", () => {
		expect(relativeTime(ist("2026-10-01", "10:00"), now)).toBe("Oct 1");
	});

	it("uses the IST day, not the UTC day", () => {
		// 01:00 IST on Oct 1 is still Sep 30 in UTC.
		expect(relativeTime(ist("2026-10-01", "01:00"), now)).toBe("Oct 1");
	});
});

describe("dateRange", () => {
	function weekOf(week: string) {
		const startsAt = weekStart(week);
		return dateRange(startsAt, startsAt + WEEK_MS);
	}

	it("shows one month once when the week stays inside it", () => {
		expect(weekOf("2026-W42")).toBe("Oct 12 – 18");
	});

	it("shows both months when the week crosses a month", () => {
		expect(weekOf("2026-W40")).toBe("Sep 28 – Oct 4");
	});

	it("shows a week that starts the new year's first Monday", () => {
		expect(weekOf("2027-W01")).toBe("Jan 4 – 10");
	});
});

describe("hourOfDay", () => {
	it("reads the hour in IST on a 24-hour clock", () => {
		expect(hourOfDay(ist("2026-10-11", "00:30"))).toBe(0);
		expect(hourOfDay(ist("2026-10-11", "17:05"))).toBe(17);
	});
});
