import { hourOfDay } from "~/shared/lib/dates";

/** "Good evening, Roshan", by the hour in India. Never a pronoun. */
export function greeting(now: number, name: string | null): string {
	const hour = hourOfDay(now);
	const part =
		hour >= 5 && hour < 12
			? "morning"
			: hour >= 12 && hour < 17
				? "afternoon"
				: "evening";
	const first = name?.trim().split(/\s+/)[0];
	return first ? `Good ${part}, ${first}` : `Good ${part}`;
}
