import type {
	ApplicationAction,
	Decision,
} from "@convex/shared/applicationRules";
import type { HackathonPhase } from "@convex/shared/hackathonPhase";
import { refusalFor, type ViewedApplication } from "~/entities/application";

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
	application: ViewedApplication,
	hackathon: { status: HackathonPhase; endsAt: number },
	now: number,
): DecideState {
	const refusal = (action: ApplicationAction) =>
		refusalFor(application, hackathon, action, now);
	const canDecide =
		refusal({ kind: "decide", decision: "not_this_time" }) === null;
	const hireRefusal = refusal({ kind: "decide", decision: "hired" });

	return {
		canShortlist:
			refusal({ kind: "shortlist", on: !application.shortlisted }) === null,
		canWalkthrough: refusal({ kind: "walkthrough" }) === null,
		canDecide,
		canHire: hireRefusal === null,
		hireHint: canDecide ? hireRefusal : null,
		decided: application.decision,
	};
}
