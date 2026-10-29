import { type Infer, v } from "convex/values";
import {
	type HackathonPhase,
	isUnderway,
	MAX_PARTICIPANTS,
} from "../hackathons/rules";

export type Decision = Infer<typeof decision>;

export type RuledApplication = {
	status: Infer<typeof applicationStatus>;
	shortlisted: boolean;
	walkthroughAt?: number;
	decision?: Decision;
};

/** What the Founder does to one Application: Screening while Open, then the Decide steps (★, the Walkthrough, the Decision). */
export type ApplicationAction =
	| { kind: "accept"; participants: number }
	| { kind: "decline" }
	| { kind: "shortlist"; on: boolean }
	| { kind: "walkthrough" }
	| { kind: "decide"; decision: Decision };

type DecideAction = Extract<
	ApplicationAction,
	{ kind: "shortlist" | "walkthrough" | "decide" }
>;

const WALKED_THROUGH = "The Walkthrough is done";

/** Why the Founder may not do `action` to `application` while its Hackathon is at `phase`, in words to show; `null` when they may. */
export function applicationRefusal(
	application: RuledApplication,
	phase: HackathonPhase,
	action: ApplicationAction,
): string | null {
	switch (action.kind) {
		case "accept":
			if (phase !== "open") {
				return "Applications are closed";
			}
			if (application.status === "participating") {
				return "They're already a Participant";
			}
			return action.participants >= MAX_PARTICIPANTS
				? `${MAX_PARTICIPANTS} Participants is the limit`
				: null;
		case "decline":
			if (phase !== "open") {
				return "Applications are closed";
			}
			return application.status === "declined"
				? "They're already declined"
				: null;
		default:
			return decideRefusal(application, phase, action);
	}
}

/** The Decide steps run in order, each once, on a Participant still undecided. */
function decideRefusal(
	application: RuledApplication,
	phase: HackathonPhase,
	action: DecideAction,
): string | null {
	if (phase === "done") {
		return "This Hackathon has ended";
	}
	if (!isUnderway(phase)) {
		return "This Hackathon isn't running";
	}
	if (application.status !== "participating") {
		return "They're not a Participant";
	}
	if (application.decision) {
		return "They're already decided";
	}
	const isWalkedThrough = application.walkthroughAt !== undefined;
	switch (action.kind) {
		case "shortlist":
			// Hired relies on the Walkthrough, which needs the ★, so the ★ stays.
			return !action.on && isWalkedThrough ? WALKED_THROUGH : null;
		case "walkthrough":
			if (!application.shortlisted) {
				return "Shortlist them first";
			}
			return isWalkedThrough ? WALKED_THROUGH : null;
		case "decide":
			if (phase !== "deciding") {
				return "Decide after the Hackathon ends";
			}
			return action.decision === "hired" && !isWalkedThrough
				? "Do the Walkthrough first"
				: null;
	}
}

export const MAX_APPLICATIONS = 500;
export const MAX_USER_APPLICATIONS = 100;
export const applicationStatus = v.union(
	v.literal("applied"),
	v.literal("declined"),
	v.literal("participating"),
);
export const decision = v.union(v.literal("hired"), v.literal("not_this_time"));

/** Longest allowed text per Application field. */
export const APPLICATION_TEXT = {
	answer: 1000,
	feedback: 280,
	walkthroughNotes: 2000,
};
