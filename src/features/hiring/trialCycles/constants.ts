import { SCORE_WEIGHTS } from "@convex/lib/reputation/scoreWeights";

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
