import { describe, expect, test } from "vitest";
import { compactCountdown, splitCountdown } from "./countdownParts";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("countdown", () => {
	test("splits a future time into days, hours and minutes", () => {
		expect(splitCountdown(2 * DAY + 3 * HOUR + 4 * MIN + 59_000, 0)).toEqual({
			days: 2,
			hours: 3,
			minutes: 4,
		});
	});

	test("a time that has arrived or passed has no countdown", () => {
		expect(splitCountdown(1000, 1000)).toBeNull();
		expect(splitCountdown(0, 1000)).toBeNull();
	});

	test("compact text uses the largest unit", () => {
		expect(compactCountdown(2 * DAY + 5 * HOUR, 0)).toBe("2d");
		expect(compactCountdown(5 * HOUR + 3 * MIN, 0)).toBe("5h");
		expect(compactCountdown(12 * MIN, 0)).toBe("12m");
		expect(compactCountdown(30_000, 0)).toBe("<1m");
		expect(compactCountdown(0, 0)).toBe("Ended");
	});
});
