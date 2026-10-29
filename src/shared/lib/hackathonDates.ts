import { dayLabel } from "./dates";

/** Hackathons end at a Monday 00:00 IST; the last day is the Sunday before. */
export function lastDay(endsAt: number): number {
	return endsAt - 1;
}

/** "Mon, Oct 12 – Sun, Oct 18": the days a Hackathon is built. */
export function buildDaysLabel(startsAt: number, endsAt: number): string {
	return `${dayLabel(startsAt)} – ${dayLabel(lastDay(endsAt))}`;
}
