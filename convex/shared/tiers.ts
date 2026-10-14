/**
 * A Rating's Tier: one of five colour bands, the same scale for Startups and people.
 * Shown as colour only; users never see a Tier's number or name.
 */
export type Tier = 1 | 2 | 3 | 4 | 5;

/** The lowest Rating of Tiers 2 to 5. */
const TIER_FLOORS = [1000, 1150, 1300, 1450] as const;

export function tierOf(rating: number): Tier {
	return (TIER_FLOORS.filter((floor) => rating >= floor).length + 1) as Tier;
}
