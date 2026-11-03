import { v } from "convex/values";

export const IST_OFFSET_MS = 5.5 * 3600_000;
const DAY_MS = 24 * 3600_000;
export const WEEK_MS = 7 * DAY_MS;

/** The ISO week of `at` in IST, as `YYYY-Www`. */
export function weekOf(at: number): string {
	const ist = new Date(at + IST_OFFSET_MS);
	// The week belongs to the year of its Thursday.
	const day = ist.getUTCDay() || 7;
	const thursday = Date.UTC(
		ist.getUTCFullYear(),
		ist.getUTCMonth(),
		ist.getUTCDate() + 4 - day,
	);
	const year = new Date(thursday).getUTCFullYear();
	const week = Math.floor((thursday - Date.UTC(year, 0, 1)) / WEEK_MS) + 1;
	return `${year}-W${String(week).padStart(2, "0")}`;
}

/** The UTC ms of Monday 00:00 IST that starts the week. */
export function weekStart(week: string): number {
	const [year, number] = week.split("-W").map(Number);
	// January 4th is always in ISO week 1.
	const jan4 = new Date(Date.UTC(year, 0, 4));
	const mondayOfWeek1 = jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * DAY_MS;
	return mondayOfWeek1 + (number - 1) * WEEK_MS - IST_OFFSET_MS;
}

/** 1 for the week the Startup signed up, then +1 each week after. */
export function cycleNumber(startupCreatedAt: number, at: number): number {
	const weeks = Math.round(
		(weekStart(weekOf(at)) - weekStart(weekOf(startupCreatedAt))) / WEEK_MS,
	);
	return weeks + 1;
}

/** The week `by` weeks after `week` (negative goes back). */
export function shiftWeek(week: string, by: number): string {
	return weekOf(weekStart(week) + by * WEEK_MS);
}

/** Activity Cycles per page; Show earlier asks for this many more. */
export const CYCLES_PAGE = 8;
export const MAX_LISTED_CYCLES = 104;
export const MAX_CYCLE_ENTRIES = 100;

const MINUTE_MS = 60_000;
const FRIDAY = 4;

/** A meeting's start and length, in minutes from midnight IST. */
export type MeetingSlot = { startMinutes: number; minutes: number };

export type Meetings = {
	opening: MeetingSlot;
	closing: MeetingSlot;
	openingLink?: string;
	closingLink?: string;
	/** The first week whose Monday is planned in a meeting. */
	firstWeek: string;
	/** Emails the Founder last created meetings for. */
	invited: string[];
};

/** Open, locked for the closing meeting, or locked until the week is started. */
export type BoardState = "open" | "closing" | "planning";

export const meetingSlot = v.object({
	startMinutes: v.number(),
	minutes: v.number(),
});

export const meetings = v.object({
	opening: meetingSlot,
	closing: meetingSlot,
	openingLink: v.optional(v.string()),
	closingLink: v.optional(v.string()),
	firstWeek: v.string(),
	invited: v.array(v.string()),
});

export const DEFAULT_SLOTS: { opening: MeetingSlot; closing: MeetingSlot } = {
	opening: { startMinutes: 600, minutes: 45 },
	closing: { startMinutes: 1020, minutes: 30 },
};

function slotOn(week: string, day: number, slot: MeetingSlot) {
	const startsAt =
		weekStart(week) + day * DAY_MS + slot.startMinutes * MINUTE_MS;
	return { startsAt, endsAt: startsAt + slot.minutes * MINUTE_MS };
}

/** The week's opening meeting, on Monday. */
export function openingOf(week: string, slot: MeetingSlot) {
	return slotOn(week, 0, slot);
}

/** The week's closing meeting, on Friday. */
export function closingOf(week: string, slot: MeetingSlot) {
	return slotOn(week, FRIDAY, slot);
}

/** The week a Card made now belongs to: from Friday's closing meeting on, the next one. */
export function cardWeek(
	now: number,
	meetings: Pick<Meetings, "closing"> | undefined,
	isSolo: boolean,
): string {
	const week = weekOf(now);
	if (isSolo || !meetings) {
		return week;
	}
	return now >= closingOf(week, meetings.closing).startsAt
		? shiftWeek(week, 1)
		: week;
}

export function boardState({
	now,
	meetings,
	isSolo,
	startedWeek,
}: {
	now: number;
	meetings: Meetings | undefined;
	isSolo: boolean;
	/** Whether this week (`weekOf(now)`) was started. */
	startedWeek: boolean;
}): BoardState {
	if (isSolo || !meetings) {
		return "open";
	}
	const week = weekOf(now);
	const closing = closingOf(week, meetings.closing);
	if (now >= closing.startsAt) {
		if (shiftWeek(week, 1) < meetings.firstWeek) {
			return "open";
		}
		return now < closing.endsAt ? "closing" : "planning";
	}
	if (week < meetings.firstWeek) {
		return "open";
	}
	return startedWeek ? "open" : "planning";
}

/** The first week planned in a meeting: the week after the next closing meeting. Kept once set. */
export function firstWeekFor(
	now: number,
	existing: Meetings | undefined,
	slots: { opening: MeetingSlot; closing: MeetingSlot },
): string {
	if (existing) {
		return existing.firstWeek;
	}
	return shiftWeek(cardWeek(now, slots, false), 1);
}

/** Why a slot can't be saved, in words to show; `null` when it can. */
export function slotRefusal(slot: MeetingSlot): string | null {
	if (
		!Number.isInteger(slot.startMinutes) ||
		slot.startMinutes % 15 !== 0 ||
		slot.startMinutes < 0 ||
		slot.startMinutes > 1425
	) {
		return "Pick a time on the quarter hour";
	}
	if (
		!Number.isInteger(slot.minutes) ||
		slot.minutes % 15 !== 0 ||
		slot.minutes < 15 ||
		slot.minutes > 180
	) {
		return "A meeting runs 15 minutes to 3 hours";
	}
	if (slot.startMinutes + slot.minutes > 1440) {
		return "The meeting has to end the same day";
	}
	return null;
}

/** Why the Founder can't start the week yet, in words to show; `null` when they can. */
export function startRefusal({
	now,
	meetings,
	state,
	reviewCount,
	people,
}: {
	now: number;
	meetings: Meetings;
	state: BoardState;
	reviewCount: number;
	people: { name: string; cardCount: number; isOff: boolean }[];
}): string | null {
	if (state !== "planning") {
		return "This week has already started";
	}
	const week = cardWeek(now, meetings, false);
	if (now < openingOf(week, meetings.opening).endsAt) {
		return "The Board opens when Monday's meeting ends";
	}
	if (reviewCount > 0) {
		return "Approve or send back the Cards in Review first";
	}
	const missing = people
		.filter((person) => person.cardCount === 0 && !person.isOff)
		.map((person) => person.name);
	if (missing.length > 0) {
		return `Everyone needs a Card this week, or mark them off: ${missing.join(", ")}`;
	}
	return null;
}

/** Threads asks for the week's scope from Monday's meeting to the end of Monday. */
export function showsScopeHint(
	now: number,
	meetings: Meetings | undefined,
	isSolo: boolean,
): boolean {
	if (isSolo || !meetings) {
		return false;
	}
	const week = weekOf(now);
	return (
		now >= openingOf(week, meetings.opening).startsAt &&
		now < weekStart(week) + DAY_MS
	);
}
