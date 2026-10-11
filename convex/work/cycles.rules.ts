// Pure: no Convex server imports, so the frontend can use it too.

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
