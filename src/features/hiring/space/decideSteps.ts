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

/** What the Founder can do next for one Builder: ★, then the Walkthrough, then the decision. */
export function decideState(
	application: {
		shortlisted: boolean;
		walkthroughAt: number | null;
		decision: Decision | null;
	},
	hackathon: {
		status: "draft" | "open" | "building" | "deciding" | "done";
		endsAt: number;
	},
	now: number,
): DecideState {
	const isOpen =
		!application.decision &&
		(hackathon.status === "building" || hackathon.status === "deciding");
	const hasEnded =
		hackathon.status === "deciding" ||
		(hackathon.status === "building" && now >= hackathon.endsAt);
	const canDecide = isOpen && hasEnded;
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
