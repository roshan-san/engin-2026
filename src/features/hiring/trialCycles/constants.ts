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

export const LEAVING_SCORE_PENALTY = -SCORE_WEIGHTS.leaving;

/** Asks an Applicant for an optional note to the Founder. */
export function askForMessage(): string | undefined {
	return window.prompt("Add a message for the Founder (optional)") ?? undefined;
}

/** What a contributor agrees to on entry (design: IP of submissions). */
export const CONTRIBUTOR_IP_TERMS =
	"You keep ownership of what you submit. The startup may use your work only if you accept their Offer, or if they pay you for it separately.";

/** The founder side of the same terms, ticked in the publish dialog. */
export const FOUNDER_IP_TERMS =
	"Participants keep ownership of what they submit. My startup may use their work only if they accept our Offer, or if we pay them for it separately.";

export function confirmIpTerms(): boolean {
	return window.confirm(CONTRIBUTOR_IP_TERMS);
}

export type TrialStatus = "draft" | "open" | "active" | "closed" | "cancelled";

/** What founders read for each status; a draft is "unpublished" in the UI. */
export const TRIAL_STATUS_LABELS: Record<TrialStatus, string> = {
	draft: "Unpublished",
	open: "Open",
	active: "Running",
	closed: "Closed",
	cancelled: "Cancelled",
};

/** The Hiring screen's hackathon groups, in display order. */
export const TRIAL_STATUS_GROUPS: readonly {
	readonly label: string;
	readonly statuses: readonly TrialStatus[];
}[] = [
	{ label: "Unpublished", statuses: ["draft"] },
	{ label: "Open", statuses: ["open"] },
	{ label: "Running", statuses: ["active"] },
	{ label: "Closed/Cancelled", statuses: ["closed", "cancelled"] },
];

/** Statuses a founder can still cancel from the Hiring screen. */
export const CANCELLABLE_STATUSES: readonly TrialStatus[] = [
	"draft",
	"open",
	"active",
];

/** Per-hackathon prices; must match the Dodo products for each plan. */
export const HACKATHON_PRICE_LABELS = {
	free: "₹2,999",
	pro: "₹1,499",
} as const;
export const PRO_PRICE_LABEL = "₹999/month";
