import { v } from "convex/values";

/**
 * A Momentum's Tier: one of five colour bands, the same scale for Startups and people.
 * Shown as colour only; users never see a Tier's number or name.
 */
export type Tier = 1 | 2 | 3 | 4 | 5;

/** The lowest Momentum of Tiers 2 to 5. */
const TIER_FLOORS = [1000, 1150, 1300, 1450] as const;

export function tierOf(momentum: number): Tier {
	return (TIER_FLOORS.filter((floor) => momentum >= floor).length + 1) as Tier;
}

/** Rows scored per scheduled run of the weekly Momentum. */
export const MOMENTUM_PAGE = 20;
/** Verified Cards counted per week; more shows as "50+". */
export const WEEK_COUNT_CAP = 50;
export const STARTING_MOMENTUM = 1000;

/** How believable a Record is. Everyone starts Low. */
export type Trust = "low" | "mid" | "high";
export const trustLevel = v.union(
	v.literal("low"),
	v.literal("mid"),
	v.literal("high"),
);

/** What one approval is worth: by the approver's Trust, or 0.25 when it's your own. */
export const APPROVAL_CREDIT = { high: 1, mid: 0.6, low: 0.25, self: 0.25 };
/** A Card approved sooner than this after it was made earns nothing. */
export const INSTANT_MS = 10 * 60_000;
export const TRUST_RULES = {
	/** Different weeks someone else approved your work, for Mid. */
	midWeeks: 4,
	/** Different weeks Mid or High people approved your work, for High. */
	highWeeks: 12,
	/** Unrelated startups those approvers have to come from, for High. */
	highStartups: 2,
	/** Weeks with no outside approval before Trust drops a level. */
	fallWeeks: 12,
};
/** Approvals read per person in one weekly step, newest first. */
export const MAX_APPROVALS_READ = 1000;

/** What one approval earns. Mutual pairs and instant approvals earn nothing; your own is never weighted by Trust. */
export function approvalCredit(
	row: { self: boolean; instant: boolean; approverTrust: Trust },
	mutual: boolean,
): number {
	if (mutual || row.instant) return 0;
	return row.self ? APPROVAL_CREDIT.self : APPROVAL_CREDIT[row.approverTrust];
}
