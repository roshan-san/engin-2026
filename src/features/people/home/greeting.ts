const HOUR = new Intl.DateTimeFormat("en-GB", {
	hour: "numeric",
	hourCycle: "h23",
	timeZone: "Asia/Kolkata",
});

/** "Good evening, Roshan", by the hour in India. Never a pronoun. */
export function greeting(now: number, name: string | null): string {
	const hour = Number(HOUR.format(now));
	const part =
		hour >= 5 && hour < 12
			? "morning"
			: hour >= 12 && hour < 17
				? "afternoon"
				: "evening";
	const first = name?.trim().split(/\s+/)[0];
	return first ? `Good ${part}, ${first}` : `Good ${part}`;
}
