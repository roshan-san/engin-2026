const IST = { timeZone: "Asia/Kolkata" } as const;
const WEEKDAY = new Intl.DateTimeFormat("en-US", { ...IST, weekday: "short" });
const DATE = new Intl.DateTimeFormat("en-US", {
	...IST,
	month: "short",
	day: "numeric",
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** How long ago `at` was: "just now", "2m ago", "3h ago", "Tue" within a week, else "Oct 4". IST. */
export function relativeTime(at: number, now: number): string {
	const elapsed = Math.max(0, now - at);
	if (elapsed < MINUTE) return "just now";
	if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
	if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
	if (elapsed < 7 * DAY) return WEEKDAY.format(at);
	return DATE.format(at);
}
