import { type Tier, tierOf } from "@convex/rating/rules";

// Written out in full so Tailwind finds the class names.
const TIER_TEXT: Record<Tier, string> = {
	1: "text-tier-1",
	2: "text-tier-2",
	3: "text-tier-3",
	4: "text-tier-4",
	5: "text-tier-5",
};

/** The text colour of a Rating's Tier, for the Rating itself or a name beside it. */
export function tierText(rating: number): string {
	return TIER_TEXT[tierOf(rating)];
}
