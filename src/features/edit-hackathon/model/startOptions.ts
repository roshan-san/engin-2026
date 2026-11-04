import { WEEK_MS, weekOf, weekStart } from "@convex/cycles/rules";
import { firstStarts } from "@convex/hackathons/rules";

export type StartOption = {
	readonly label: "Next Monday" | "Monday after" | "In 2 weeks";
	readonly startsAt: number;
};

const LABELS = ["Next Monday", "Monday after", "In 2 weeks"] as const;

/** The two Mondays (00:00 IST) a Hackathon can start on: at least 3 days away. */
export function startOptions(now: number): StartOption[] {
	const next = weekStart(weekOf(now)) + WEEK_MS;
	return firstStarts(now).map((startsAt) => ({
		label: LABELS[Math.round((startsAt - next) / WEEK_MS)],
		startsAt,
	}));
}
