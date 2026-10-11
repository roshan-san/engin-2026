const DAY = new Intl.DateTimeFormat("en-US", {
	timeZone: "Asia/Kolkata",
	weekday: "short",
	month: "short",
	day: "numeric",
});

/** "Mon, Oct 20", in IST like every Cycle. */
export function dayLabel(at: number): string {
	return DAY.format(at);
}

/** Hackathons end at a Monday 00:00 IST; the last day is the Sunday before. */
export function lastDay(endsAt: number): number {
	return endsAt - 1;
}
