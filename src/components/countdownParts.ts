const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Days, hours and whole minutes until `to`, or null once `to` has arrived. */
export function splitCountdown(
	to: number,
	now: number,
): { days: number; hours: number; minutes: number } | null {
	const remaining = to - now;
	if (remaining <= 0) return null;
	return {
		days: Math.floor(remaining / DAY),
		hours: Math.floor((remaining % DAY) / HOUR),
		minutes: Math.floor((remaining % HOUR) / MINUTE),
	};
}

/** The largest non-zero unit: "2d", "5h", "12m", "<1m", or "Ended". */
export function compactCountdown(to: number, now: number): string {
	const parts = splitCountdown(to, now);
	if (!parts) return "Ended";
	if (parts.days > 0) return `${parts.days}d`;
	if (parts.hours > 0) return `${parts.hours}h`;
	if (parts.minutes > 0) return `${parts.minutes}m`;
	return "<1m";
}
