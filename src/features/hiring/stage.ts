import { dayLabel, lastDay, monthDayLabel } from "./hackathonDates";

type Status = "draft" | "open" | "live" | "deciding" | "done";
type Tone = "neutral" | "link" | "success" | "warning";

/** Each stage's badge: its name and the colour of its dot. */
export const STAGE: Record<Status, { label: string; tone: Tone }> = {
	draft: { label: "Draft", tone: "neutral" },
	open: { label: "Open", tone: "link" },
	live: { label: "Live", tone: "success" },
	deciding: { label: "Deciding", tone: "warning" },
	done: { label: "Done", tone: "neutral" },
};

/** The date that matters at this stage: "ends Sun, Oct 25", or "ends Oct 25" when `isShort` (phones). */
export function stageDate(
	hackathon: {
		status: Status;
		startsAt: number;
		endsAt: number;
		decideBy: number;
	},
	isShort = false,
): string {
	const label = isShort ? monthDayLabel : dayLabel;
	switch (hackathon.status) {
		case "draft":
		case "open":
			return `starts ${label(hackathon.startsAt)}`;
		case "live":
			return `ends ${label(lastDay(hackathon.endsAt))}`;
		case "deciding":
			return `decide by ${label(lastDay(hackathon.decideBy))}`;
		case "done":
			return `ended ${label(lastDay(hackathon.endsAt))}`;
	}
}
