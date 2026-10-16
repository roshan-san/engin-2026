import { dayLabel, lastDay } from "./hackathonDates";

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

/** The date that matters at this stage: "ends Sun, Oct 25". */
export function stageDate(hackathon: {
	status: Status;
	startsAt: number;
	endsAt: number;
	decideBy: number;
}): string {
	switch (hackathon.status) {
		case "draft":
		case "open":
			return `starts ${dayLabel(hackathon.startsAt)}`;
		case "live":
			return `ends ${dayLabel(lastDay(hackathon.endsAt))}`;
		case "deciding":
			return `decide by ${dayLabel(lastDay(hackathon.decideBy))}`;
		case "done":
			return `ended ${dayLabel(lastDay(hackathon.endsAt))}`;
	}
}
