import { dayLabel, lastDay } from "../hackathonDates";

type Status = "draft" | "open" | "building" | "deciding" | "done";

/** Where the Hackathon is, in one line: "Building · ends Sun, Oct 25". */
export function spaceStatusLine(
	hackathon: {
		status: Status;
		startsAt: number;
		endsAt: number;
		decideBy: number;
	},
	hires: number,
): string {
	switch (hackathon.status) {
		case "draft":
			return "Draft";
		case "open":
			return `Open · starts ${dayLabel(hackathon.startsAt)}`;
		case "building":
			return `Building · ends ${dayLabel(lastDay(hackathon.endsAt))}`;
		case "deciding":
			return `Deciding · by ${dayLabel(lastDay(hackathon.decideBy))}`;
		case "done":
			return hires > 0 ? `Done · ${hires} hired` : "Done · No hire";
	}
}
