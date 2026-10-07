import type { Doc } from "@convex/_generated/dataModel";
import { SCORE_WEIGHTS } from "@convex/people/scoreWeights.rules";

export const VERDICTS = [
	{ value: "passed_with_offer", label: "Passed with Offer" },
	{ value: "passed", label: "Passed" },
	{ value: "not_passed", label: "Not passed" },
] as const;

export type Verdict = (typeof VERDICTS)[number]["value"];

export function verdictLabel(verdict: Verdict): string {
	return VERDICTS.find((entry) => entry.value === verdict)?.label ?? verdict;
}

export type OfferStatus = Doc<"offers">["status"];

/** How an Offer reads next to its Verdict. */
export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
	pending: "Offer pending",
	accepted: "Offer accepted",
	declined: "Offer declined",
	withdrawn: "Offer withdrawn",
};

export const LEAVING_SCORE_PENALTY = -SCORE_WEIGHTS.leaving;

/** What a contributor agrees to on entry (design: IP of submissions). */
export const CONTRIBUTOR_IP_TERMS =
	"You keep ownership of what you submit. The startup may use your work only if you accept their Offer, or if they pay you for it separately.";

/** The founder side of the same terms, ticked in the publish dialog. */
export const FOUNDER_IP_TERMS =
	"Participants keep ownership of what they submit. My startup may use their work only if they accept our Offer, or if we pay them for it separately.";

export type HackathonStatus =
	| "draft"
	| "open"
	| "active"
	| "closed"
	| "cancelled";

/** What founders read for each status; a draft is "unpublished" in the UI. */
export const HACKATHON_STATUS_LABELS: Record<HackathonStatus, string> = {
	draft: "Unpublished",
	open: "Open",
	active: "Running",
	closed: "Closed",
	cancelled: "Cancelled",
};

/** What the public reads on a hackathon page; drafts never reach it. */
export const PUBLIC_HACKATHON_STATUS_LABELS: Record<HackathonStatus, string> = {
	draft: "Unpublished",
	open: "Accepting applications",
	active: "Running",
	closed: "Closed",
	cancelled: "Cancelled",
};

/** The Hiring screen's hackathon groups, in display order. */
export const HACKATHON_STATUS_GROUPS: readonly {
	readonly label: string;
	readonly statuses: readonly HackathonStatus[];
}[] = [
	{ label: "Unpublished", statuses: ["draft"] },
	{ label: "Open", statuses: ["open"] },
	{ label: "Running", statuses: ["active"] },
	{ label: "Closed/Cancelled", statuses: ["closed", "cancelled"] },
];

/** Statuses a founder can still cancel from the Hiring screen. */
export const CANCELLABLE_STATUSES: readonly HackathonStatus[] = [
	"draft",
	"open",
	"active",
];
