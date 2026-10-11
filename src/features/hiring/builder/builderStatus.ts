import { dayLabel, lastDay } from "../hackathonDates";

type HackathonStatus = "draft" | "open" | "building" | "deciding" | "done";

export type BuilderStatus = {
	/** The header line: "Starts Mon, Oct 19", "Ends Sun, Oct 25", "Ended". */
	readonly line: string;
	/** The Board can't be worked: not started yet, or over. */
	readonly isClosed: boolean;
	/** One calm line above the Board, when there's something to say. */
	readonly note: string | null;
};

/** Where a Builder stands on their own Board, before, during and after the Hackathon. */
export function builderStatus(
	hackathon: { status: HackathonStatus; startsAt: number; endsAt: number },
	decision: "hired" | "not_this_time" | null,
	now: number,
): BuilderStatus {
	if (hackathon.status === "draft" || hackathon.status === "open") {
		return {
			line: `Starts ${dayLabel(hackathon.startsAt)}`,
			isClosed: true,
			note: "Your Cards arrive when it starts.",
		};
	}
	if (hackathon.status === "building" && now < hackathon.endsAt) {
		return {
			line: `Ends ${dayLabel(lastDay(hackathon.endsAt))}`,
			isClosed: false,
			note: null,
		};
	}
	if (decision) {
		return { line: "Ended", isClosed: true, note: null };
	}
	return {
		line: "Ended",
		isClosed: true,
		note:
			hackathon.status === "done"
				? "It closed without a decision."
				: "Waiting for the Founder's decision.",
	};
}
