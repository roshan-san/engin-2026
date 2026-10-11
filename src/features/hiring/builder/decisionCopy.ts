import { dayLabel, lastDay } from "../hackathonDates";

export function decisionTitle(
	decision: "hired" | "not_this_time",
): "Hired." | "Not this time." {
	return decision === "hired" ? "Hired." : "Not this time.";
}

/** "Ends Sun, Oct 25" while building, then "Ended". */
export function builderHeaderLine(
	hackathon: {
		status: "draft" | "open" | "building" | "deciding" | "done";
		endsAt: number;
	},
	now: number,
): string {
	return hackathon.status === "building" && now < hackathon.endsAt
		? `Ends ${dayLabel(lastDay(hackathon.endsAt))}`
		: "Ended";
}
