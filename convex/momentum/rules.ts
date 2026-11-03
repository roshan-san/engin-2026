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
