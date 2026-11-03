import { type Tier, tierOf } from "@convex/momentum/rules";

// Written out in full so Tailwind finds the class names.
const TIER_TEXT: Record<Tier, string> = {
	1: "text-tier-1",
	2: "text-tier-2",
	3: "text-tier-3",
	4: "text-tier-4",
	5: "text-tier-5",
};

/** The text colour of a Momentum's Tier, for the Momentum itself or a name beside it. */
export function tierText(rating: number): string {
	return TIER_TEXT[tierOf(rating)];
}
