import { describe, expect, it } from "vitest";
import { stageDate } from "./stage";

/** A moment in IST, as a timestamp. */
function ist(day: number, hour = 0) {
	return Date.UTC(2026, 9, day, hour) - 5.5 * 3600_000;
}

const hackathon = {
	startsAt: ist(19),
	endsAt: ist(26),
	decideBy: Date.UTC(2026, 10, 2) - 5.5 * 3600_000,
};

describe("stageDate", () => {
	it("names the date that matters at each stage", () => {
		expect(stageDate({ ...hackathon, status: "draft" })).toBe(
			"starts Mon, Oct 19",
		);
		expect(stageDate({ ...hackathon, status: "open" })).toBe(
			"starts Mon, Oct 19",
		);
		expect(stageDate({ ...hackathon, status: "live" })).toBe(
			"ends Sun, Oct 25",
		);
		expect(stageDate({ ...hackathon, status: "deciding" })).toBe(
			"decide by Sun, Nov 1",
		);
		expect(stageDate({ ...hackathon, status: "done" })).toBe(
			"ended Sun, Oct 25",
		);
	});

	it("drops the weekday on a phone", () => {
		expect(stageDate({ ...hackathon, status: "open" }, true)).toBe(
			"starts Oct 19",
		);
		expect(stageDate({ ...hackathon, status: "live" }, true)).toBe(
			"ends Oct 25",
		);
	});
});
