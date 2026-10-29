/** Every date the app shows is IST, like every Cycle. */
function ist(options: Intl.DateTimeFormatOptions) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Kolkata",
		...options,
	});
}

const WEEKDAY = ist({ weekday: "short" });
const MONTH = ist({ month: "short" });
const DAY_OF_MONTH = ist({ day: "numeric" });
const MONTH_DAY = ist({ month: "short", day: "numeric" });
const DAY = ist({ weekday: "short", month: "short", day: "numeric" });
const MONTH_YEAR = ist({ month: "short", year: "numeric" });
const HOUR = ist({ hour: "numeric", hourCycle: "h23" });

const MINUTE = 60_000;
const HOUR_MS = 60 * MINUTE;
const DAY_MS = 24 * HOUR_MS;

/** "Tue". */
export function weekdayLabel(at: number): string {
	return WEEKDAY.format(at);
}

/** "Oct 20". */
export function monthDayLabel(at: number): string {
	return MONTH_DAY.format(at);
}

/** "Mon, Oct 20". */
export function dayLabel(at: number): string {
	return DAY.format(at);
}

/** "Oct 2026". */
export function monthYearLabel(at: number): string {
	return MONTH_YEAR.format(at);
}

/** The hour of the day, 0 to 23. */
export function hourOfDay(at: number): number {
	return Number(HOUR.format(at));
}

/** The days from `startsAt` up to `endsAt` (exclusive): "Oct 12 – 18" within a month, "Sep 28 – Oct 4" across. */
export function dateRange(startsAt: number, endsAt: number): string {
	const lastDay = endsAt - 1;
	const startMonth = MONTH.format(startsAt);
	const endMonth = MONTH.format(lastDay);
	const start = `${startMonth} ${DAY_OF_MONTH.format(startsAt)}`;
	const end =
		startMonth === endMonth
			? DAY_OF_MONTH.format(lastDay)
			: `${endMonth} ${DAY_OF_MONTH.format(lastDay)}`;

	return `${start} – ${end}`;
}

/** How long ago `at` was: "just now", "2m ago", "3h ago", "Tue" within a week, else "Oct 4". */
export function relativeTime(at: number, now: number): string {
	const elapsed = Math.max(0, now - at);
	if (elapsed < MINUTE) return "just now";
	if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE)}m ago`;
	if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
	if (elapsed < 7 * DAY_MS) return weekdayLabel(at);
	return monthDayLabel(at);
}
