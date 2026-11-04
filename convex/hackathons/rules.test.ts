import { describe, expect, it } from "vitest";
import {
	canStartAt,
	firstStarts,
	type HackathonPhase,
	isRunning,
	isUnderway,
	phaseOf,
} from "./rules";

const endsAt = 1_000_000;

describe("phaseOf", () => {
	it.each<[HackathonPhase, HackathonPhase, HackathonPhase]>([
		["draft", "draft", "draft"],
		["open", "open", "open"],
		["live", "live", "deciding"],
		["deciding", "deciding", "deciding"],
		["done", "done", "done"],
	])(
		"a %s Hackathon is %s before it ends and %s after",
		(status, before, after) => {
			expect(phaseOf({ status, endsAt }, endsAt - 1)).toBe(before);
			expect(phaseOf({ status, endsAt }, endsAt)).toBe(after);
		},
	);
});

describe("running and underway", () => {
	it.each<[HackathonPhase, boolean, boolean]>([
		["draft", false, false],
		["open", true, false],
		["live", true, true],
		["deciding", true, true],
		["done", false, false],
	])("a %s Hackathon: running %s, underway %s", (phase, running, underway) => {
		expect(isRunning(phase)).toBe(running);
		expect(isUnderway(phase)).toBe(underway);
	});
});

/** A moment in IST, as a timestamp. */
function ist(month: number, day: number, hour: number, minute = 0) {
	return Date.UTC(2026, month - 1, day, hour, minute) - 5.5 * 3600_000;
}
const DAY = 24 * 3600_000;
// Monday 19 Oct 2026, 00:00 IST.
const monday = ist(10, 19, 0);

describe("canStartAt", () => {
	it("a Monday exactly 3 days away is fine", () => {
		expect(canStartAt(monday, monday - 3 * DAY)).toBe(true);
	});

	it("a minute under 3 days is too soon", () => {
		expect(canStartAt(monday, monday - 3 * DAY + 60_000)).toBe(false);
	});

	it("a Tuesday is not a start", () => {
		expect(canStartAt(monday + DAY, monday - 7 * DAY)).toBe(false);
	});

	it("a past Monday is not a start", () => {
		expect(canStartAt(monday, monday + DAY)).toBe(false);
	});
});

describe("firstStarts", () => {
	it("on Thursday noon, next Monday and the one after", () => {
		expect(firstStarts(ist(10, 15, 12))).toEqual([monday, monday + 7 * DAY]);
	});

	it("on Friday just after midnight, the Monday after and the one after that", () => {
		expect(firstStarts(ist(10, 16, 0, 1))).toEqual([
			monday + 7 * DAY,
			monday + 14 * DAY,
		]);
	});
});
