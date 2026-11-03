import { type Infer, v } from "convex/values";
import {
	type HackathonPhase,
	isUnderway,
	MAX_PARTICIPANTS,
} from "../hackathons/rules";
import { MAX_PRIVATE_THREADS } from "../threads/rules";

export type Decision = Infer<typeof decision>;

export type RuledApplication = {
	status: Infer<typeof applicationStatus>;
	shortlisted: boolean;
	walkthroughRequestedAt?: number;
	walkthroughAt?: number;
	decision?: Decision;
};

/** Ask stops here, so the Builders' own threads always fit in one read. */
export const MAX_ASKS = MAX_PRIVATE_THREADS - MAX_PARTICIPANTS;

/** What the Founder does to one Application: Screening while Open, then the Decide steps (★, the Walkthrough, the Decision). */
export type ApplicationAction =
	| { kind: "accept"; participants: number }
	| { kind: "decline" }
	| { kind: "ask"; privateThreads: number }
	| { kind: "shortlist"; on: boolean }
	| { kind: "requestWalkthrough" }
	| { kind: "walkthrough" }
	| { kind: "decide"; decision: Decision };

type DecideAction = Extract<
	ApplicationAction,
	{ kind: "shortlist" | "requestWalkthrough" | "walkthrough" | "decide" }
>;

const WALKED_THROUGH = "The Walkthrough is done";
const REQUESTED = "The Walkthrough is requested";

/** What the Founder posts in the private thread when they request a Walkthrough. */
export const WALKTHROUGH_QUESTIONS = `Walkthrough: I'd like a call about your work.
1. Walk me through the Card you're proudest of: what you built and why that way.
2. Where did you get stuck, and how did you get unstuck?
3. What would you change with another week?
Reply with times that work for a call.`;

/** Requested, or done before requests existed. */
export function isWalkthroughRequested(application: {
	walkthroughRequestedAt?: number;
	walkthroughAt?: number;
}): boolean {
	return (
		application.walkthroughRequestedAt !== undefined ||
		application.walkthroughAt !== undefined
	);
}

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
				return "They're already a Builder";
			}
			return action.participants >= MAX_PARTICIPANTS
				? `${MAX_PARTICIPANTS} Builders is the limit`
				: null;
		case "decline":
			if (phase !== "open") {
				return "Applications are closed";
			}
			return application.status === "declined"
				? "They're already declined"
				: null;
		case "ask":
			if (phase === "done") {
				return "This Hackathon has ended";
			}
			if (application.status === "declined") {
				return "They're already declined";
			}
			return action.privateThreads >= MAX_ASKS
				? `Ask up to ${MAX_ASKS} people`
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
		return "They're not a Builder";
	}
	if (application.decision) {
		return "They're already decided";
	}
	const isWalkedThrough = application.walkthroughAt !== undefined;
	const isRequested = isWalkthroughRequested(application);
	switch (action.kind) {
		case "shortlist":
			// An Offer relies on the Walkthrough, which needs the ★, so the ★ stays.
			if (action.on || !isRequested) {
				return null;
			}
			return isWalkedThrough ? WALKED_THROUGH : REQUESTED;
		case "requestWalkthrough":
			if (!application.shortlisted) {
				return "Shortlist them first";
			}
			if (isWalkedThrough) {
				return WALKED_THROUGH;
			}
			return isRequested ? REQUESTED : null;
		case "walkthrough":
			if (!application.shortlisted) {
				return "Shortlist them first";
			}
			if (isWalkedThrough) {
				return WALKED_THROUGH;
			}
			return isRequested ? null : "Request the Walkthrough first";
		case "decide":
			if (phase !== "deciding") {
				return "Decide after the Hackathon ends";
			}
			return action.decision === "hired" && !isWalkedThrough
				? "Do the Walkthrough first"
				: null;
	}
}

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
	offerTerms: 140,
	walkthroughNotes: 2000,
};

/** Terms for an Offer made before Offers had terms, when it's resent. */
export const OLD_OFFER_TERMS = "An Offer to join the team";

export type OfferState = "none" | "pending" | "expired" | "declined" | "joined";

/** Where an Offer stands. A revoked Offer Invite reads as expired, so it can be resent. */
export function offerState(
	application: {
		decision?: Decision;
		joinedAt?: number;
		offerDeclinedAt?: number;
	},
	hasOpenInvite: boolean,
): OfferState {
	if (application.decision !== "hired") return "none";
	if (application.joinedAt !== undefined) return "joined";
	if (application.offerDeclinedAt !== undefined) return "declined";
	return hasOpenInvite ? "pending" : "expired";
}

/** Why the Founder can't resend this Offer, or null. */
export function resendRefusal(state: OfferState): string | null {
	switch (state) {
		case "expired":
			return null;
		case "none":
			return "There's no Offer to resend";
		case "pending":
			return "The Offer is still open";
		case "joined":
			return "They've joined";
		case "declined":
			return "They declined the Offer";
	}
}
