import { WEEK_MS, weekOf, weekStart } from "@convex/shared/cycles";

export type StartOption = {
	readonly label: "Next Monday" | "Monday after";
	readonly startsAt: number;
};

/** The two Mondays (00:00 IST) a Hackathon can start on: both still to come. */
export function startOptions(now: number): StartOption[] {
	const next = weekStart(weekOf(now)) + WEEK_MS;
	return [
		{ label: "Next Monday", startsAt: next },
		{ label: "Monday after", startsAt: next + WEEK_MS },
	];
}
