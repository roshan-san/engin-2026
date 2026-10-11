import { DECIDE_GRACE_MS } from "@convex/lib/limits";
import { WEEK_MS } from "@convex/work/cycles.rules";

const DAY = new Intl.DateTimeFormat("en-US", {
	timeZone: "Asia/Kolkata",
	weekday: "short",
	month: "short",
	day: "numeric",
});

const MONTH_DAY = new Intl.DateTimeFormat("en-US", {
	timeZone: "Asia/Kolkata",
	month: "short",
	day: "numeric",
});

/** "Oct 20", in IST. */
export function monthDayLabel(at: number): string {
	return MONTH_DAY.format(at);
}

/** "Mon, Oct 20", in IST like every Cycle. */
export function dayLabel(at: number): string {
	return DAY.format(at);
}

/** Hackathons end at a Monday 00:00 IST; the last day is the Sunday before. */
export function lastDay(endsAt: number): number {
	return endsAt - 1;
}

/** "Mon, Oct 12 – Sun, Oct 18": the days a Hackathon is built. */
export function buildDaysLabel(startsAt: number, endsAt: number): string {
	return `${dayLabel(startsAt)} – ${dayLabel(lastDay(endsAt))}`;
}

/** When it ends and when decisions are due, the way `hackathons.create` sets them. */
export function hackathonDates(
	startsAt: number,
	weeks: 1 | 2,
): { endsAt: number; decideBy: number } {
	const endsAt = startsAt + weeks * WEEK_MS;
	return { endsAt, decideBy: endsAt + DECIDE_GRACE_MS };
}
