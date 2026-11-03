import { isNotFinished } from "@convex/cards/rules";
import type { CardView } from "./types";

/**
 * The Board without Cards whose week has ended. The page knows the week from its
 * own clock, so they leave when the week turns, not at the next Card change.
 */
export function hideEndedCards(
	cards: CardView[],
	planningWeek: string | undefined,
): CardView[] {
	if (planningWeek === undefined) {
		return cards;
	}
	return cards.filter(
		(card) =>
			!isNotFinished(
				{ status: card.status, week: card.week ?? undefined },
				planningWeek,
			),
	);
}
