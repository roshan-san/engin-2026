import {
	type HackathonPhase,
	isUnderway,
	phaseOf,
} from "@convex/shared/hackathonPhase";

type Decision = "hired" | "not_this_time";

export type DecideState = {
	readonly canShortlist: boolean;
	readonly canWalkthrough: boolean;
	readonly canDecide: boolean;
	readonly canHire: boolean;
	/** Why Hired is off when Not this time is on. */
	readonly hireHint: string | null;
	readonly decided: Decision | null;
};

/** What the Founder can do next for one Participant: ★, then the Walkthrough, then the decision. */
export function decideState(
	application: {
		shortlisted: boolean;
		walkthroughAt: number | null;
		decision: Decision | null;
	},
	hackathon: { status: HackathonPhase; endsAt: number },
	now: number,
): DecideState {
	const phase = phaseOf(hackathon, now);
	const isOpen = !application.decision && isUnderway(phase);
	const canDecide = isOpen && phase === "deciding";
	const isWalkedThrough = application.walkthroughAt !== null;

	return {
		canShortlist: isOpen,
		canWalkthrough: isOpen && application.shortlisted && !isWalkedThrough,
		canDecide,
		canHire: canDecide && isWalkedThrough,
		hireHint: canDecide && !isWalkedThrough ? "Do the Walkthrough first" : null,
		decided: application.decision,
	};
}
