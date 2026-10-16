import { type HackathonPhase, phaseOf } from "@convex/shared/hackathonPhase";
import { dayLabel, lastDay } from "../hackathonDates";

export type ParticipantStatus = {
	/** The header line: "Starts Mon, Oct 19", "Ends Sun, Oct 25", "Ended". */
	readonly line: string;
	/** One calm line above the Board, when there's something to say. */
	readonly note: string | null;
};

/** Where a Participant stands on their own Board, before, during and after the Hackathon. */
export function participantStatus(
	hackathon: { status: HackathonPhase; startsAt: number; endsAt: number },
	decision: "hired" | "not_this_time" | null,
	now: number,
): ParticipantStatus {
	const phase = phaseOf(hackathon, now);
	if (phase === "draft" || phase === "open") {
		return {
			line: `Starts ${dayLabel(hackathon.startsAt)}`,
			note: "Your Cards arrive when it starts.",
		};
	}
	if (phase === "live") {
		return {
			line: `Ends ${dayLabel(lastDay(hackathon.endsAt))}`,
			note: null,
		};
	}
	if (decision) {
		return { line: "Ended", note: null };
	}
	return {
		line: "Ended",
		note:
			hackathon.status === "done"
				? "It closed without a decision."
				: "Waiting for the Founder's decision.",
	};
}

/** The Participant tab row's right end: the Decision once it's in, else where the Hackathon stands ("Deciding" while the Founder decides, "Closed" if it ended without a Decision). */
export function participantStatusText(
	hackathon: { status: HackathonPhase; startsAt: number; endsAt: number },
	decision: "hired" | "not_this_time" | null,
	now: number,
): string {
	if (decision === "hired") return "Hired";
	if (decision === "not_this_time") return "Not this time";
	const { line } = participantStatus(hackathon, decision, now);
	if (line !== "Ended") return line;
	return hackathon.status === "done" ? "Closed" : "Deciding";
}
