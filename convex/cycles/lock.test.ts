import { describe, expect, it } from "vitest";
import {
	boardState,
	cardWeek,
	closingOf,
	DEFAULT_SLOTS,
	firstWeekFor,
	type Meetings,
	openingOf,
	showsScopeHint,
	slotRefusal,
	startRefusal,
} from "./lock";

/** A time in IST, as UTC ms. */
const ist = (date: string, time: string) =>
	Date.parse(`${date}T${time}:00+05:30`);

// 2026-W45 runs Monday 2026-11-02 to Sunday 2026-11-08 IST.
const meetings: Meetings = {
	...DEFAULT_SLOTS,
	firstWeek: "2026-W45",
	invited: [],
};
const MONDAY = "2026-11-02";
const TUESDAY = "2026-11-03";
const WEDNESDAY = "2026-11-04";
const THURSDAY = "2026-11-05";
const FRIDAY = "2026-11-06";
const SATURDAY = "2026-11-07";
const SUNDAY = "2026-11-08";

describe("meeting times", () => {
	it("the opening meeting is Monday and the closing meeting Friday, in IST", () => {
		expect(openingOf("2026-W45", { startMinutes: 600, minutes: 45 })).toEqual({
			startsAt: Date.parse("2026-11-02T04:30:00Z"),
			endsAt: Date.parse("2026-11-02T05:15:00Z"),
		});
		expect(closingOf("2026-W45", { startMinutes: 1020, minutes: 30 })).toEqual({
			startsAt: Date.parse("2026-11-06T11:30:00Z"),
			endsAt: Date.parse("2026-11-06T12:00:00Z"),
		});
	});

	it("defaults to 10:00 for 45 minutes and 17:00 for 30 minutes", () => {
		expect(DEFAULT_SLOTS).toEqual({
			opening: { startMinutes: 600, minutes: 45 },
			closing: { startMinutes: 1020, minutes: 30 },
		});
	});
});

describe("the week a new Card joins", () => {
	it("is this week until Friday's meeting starts, then next week", () => {
		expect(cardWeek(ist(FRIDAY, "16:59"), meetings, false)).toBe("2026-W45");
		expect(cardWeek(ist(FRIDAY, "17:00"), meetings, false)).toBe("2026-W46");
		expect(cardWeek(ist(SUNDAY, "12:00"), meetings, false)).toBe("2026-W46");
	});

	it("is always this week for a solo Founder or a team without meetings", () => {
		expect(cardWeek(ist(SUNDAY, "12:00"), meetings, true)).toBe("2026-W45");
		expect(cardWeek(ist(SUNDAY, "12:00"), undefined, false)).toBe("2026-W45");
	});
});

describe("whether the Board is open", () => {
	const state = (now: number, startedWeek: boolean) =>
		boardState({ now, meetings, isSolo: false, startedWeek });

	it("is open once the week has started, until Friday's meeting", () => {
		expect(state(ist(TUESDAY, "12:00"), true)).toBe("open");
		expect(state(ist(TUESDAY, "12:00"), false)).toBe("planning");
	});

	it("locks for the closing meeting, then for planning", () => {
		expect(state(ist(FRIDAY, "17:10"), true)).toBe("closing");
		expect(state(ist(FRIDAY, "17:30"), true)).toBe("planning");
		expect(state(ist(SATURDAY, "12:00"), true)).toBe("planning");
	});

	it("never locks for a solo Founder or a team without meetings", () => {
		const saturday = ist(SATURDAY, "12:00");
		expect(
			boardState({ now: saturday, meetings, isSolo: true, startedWeek: false }),
		).toBe("open");
		expect(
			boardState({
				now: saturday,
				meetings: undefined,
				isSolo: false,
				startedWeek: false,
			}),
		).toBe("open");
	});
});

describe("the first week with meetings", () => {
	it("saved midweek: open until this Friday's closing meeting", () => {
		const firstWeek = firstWeekFor(
			ist(WEDNESDAY, "12:00"),
			undefined,
			DEFAULT_SLOTS,
		);
		expect(firstWeek).toBe("2026-W46");

		const saved = { ...meetings, firstWeek };
		const at = (now: number) =>
			boardState({ now, meetings: saved, isSolo: false, startedWeek: false });
		expect(at(ist(THURSDAY, "12:00"))).toBe("open");
		expect(at(ist(FRIDAY, "17:10"))).toBe("closing");
	});

	it("saved at the weekend: open until the next Friday's closing meeting", () => {
		const firstWeek = firstWeekFor(
			ist(SATURDAY, "12:00"),
			undefined,
			DEFAULT_SLOTS,
		);
		expect(firstWeek).toBe("2026-W47");

		const saved = { ...meetings, firstWeek };
		const at = (now: number) =>
			boardState({ now, meetings: saved, isSolo: false, startedWeek: false });
		expect(at(ist(SATURDAY, "13:00"))).toBe("open");
		expect(at(ist("2026-11-10", "12:00"))).toBe("open");
		expect(at(ist("2026-11-13", "17:10"))).toBe("closing");
	});

	it("keeps the first week when the times change", () => {
		expect(firstWeekFor(ist(SATURDAY, "12:00"), meetings, DEFAULT_SLOTS)).toBe(
			"2026-W45",
		);
	});
});

describe("a meeting slot", () => {
	it("starts on the quarter hour, runs 15 minutes to 3 hours, and ends the same day", () => {
		expect(slotRefusal({ startMinutes: 600, minutes: 45 })).toBeNull();
		expect(slotRefusal({ startMinutes: 605, minutes: 45 })).toBe(
			"Pick a time on the quarter hour",
		);
		expect(slotRefusal({ startMinutes: 600, minutes: 0 })).toBe(
			"A meeting runs 15 minutes to 3 hours",
		);
		expect(slotRefusal({ startMinutes: 600, minutes: 195 })).toBe(
			"A meeting runs 15 minutes to 3 hours",
		);
		expect(slotRefusal({ startMinutes: 1410, minutes: 45 })).toBe(
			"The meeting has to end the same day",
		);
	});
});

describe("Start the week", () => {
	const ready = {
		now: ist(MONDAY, "10:46"),
		meetings,
		state: "planning" as const,
		reviewCount: 0,
		people: [
			{ name: "Asha", cardCount: 2, isOff: false },
			{ name: "Ravi", cardCount: 1, isOff: false },
		],
	};

	it("works once the meeting has ended and everyone has a Card", () => {
		expect(startRefusal(ready)).toBeNull();
	});

	it("is refused when the week has already started", () => {
		expect(startRefusal({ ...ready, state: "open" })).toBe(
			"This week has already started",
		);
	});

	it("waits for Monday's meeting to end", () => {
		expect(startRefusal({ ...ready, now: ist(MONDAY, "10:30") })).toBe(
			"The Board opens when Monday's meeting ends",
		);
		expect(startRefusal({ ...ready, now: ist(SATURDAY, "12:00") })).toBe(
			"The Board opens when Monday's meeting ends",
		);
	});

	it("needs Review empty", () => {
		expect(startRefusal({ ...ready, reviewCount: 1 })).toBe(
			"Approve or send back the Cards in Review first",
		);
	});

	it("names everyone without a Card who isn't off", () => {
		const people = [
			{ name: "Asha", cardCount: 1, isOff: false },
			{ name: "Ravi", cardCount: 0, isOff: false },
			{ name: "Meera", cardCount: 0, isOff: false },
			{ name: "Dev", cardCount: 0, isOff: true },
		];
		expect(startRefusal({ ...ready, people })).toBe(
			"Everyone needs a Card this week, or mark them off: Ravi, Meera",
		);
	});
});

describe("the Threads hint", () => {
	it("shows from Monday's meeting until the end of Monday, for teams", () => {
		expect(showsScopeHint(ist(MONDAY, "09:59"), meetings, false)).toBe(false);
		expect(showsScopeHint(ist(MONDAY, "10:00"), meetings, false)).toBe(true);
		expect(showsScopeHint(ist(MONDAY, "23:59"), meetings, false)).toBe(true);
		expect(showsScopeHint(ist(TUESDAY, "00:00"), meetings, false)).toBe(false);
		expect(showsScopeHint(ist(MONDAY, "12:00"), meetings, true)).toBe(false);
		expect(showsScopeHint(ist(MONDAY, "12:00"), undefined, false)).toBe(false);
	});
});
