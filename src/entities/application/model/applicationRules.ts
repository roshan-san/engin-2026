import { type HackathonPhase, phaseOf } from "@convex/hackathons/rules";
import {
	type ApplicationAction,
	applicationRefusal,
	type Decision,
} from "@convex/shared/applicationRules";

/** An Application as the Founder's views see it. */
export type ViewedApplication = {
	readonly status: "applied" | "declined" | "participating";
	readonly shortlisted: boolean;
	readonly walkthroughAt: number | null;
	readonly decision: Decision | null;
};

/** `applicationRefusal` for an Application as the browser sees it: `null` when the Founder may do `action`. */
export function refusalFor(
	application: ViewedApplication,
	hackathon: { readonly status: HackathonPhase; readonly endsAt: number },
	action: ApplicationAction,
	now: number,
): string | null {
	return applicationRefusal(
		{
			status: application.status,
			shortlisted: application.shortlisted,
			walkthroughAt: application.walkthroughAt ?? undefined,
			decision: application.decision ?? undefined,
		},
		phaseOf(hackathon, now),
		action,
	);
}
