/**
 * Score weights (ADR 0002). Dependency-free so the UI can show the same
 * numbers the backend applies.
 */
export const SCORE_WEIGHTS = {
	passedVerdict: 80,
	verifiedPulse: 10,
	acceptedOffer: 120,
	leaving: -40,
} as const;
