import type { Id } from "@convex/_generated/dataModel";
import type { CardView } from "./types";

/** The Board as it looks once `cardId` is verified, shown before the server answers so V can't verify it twice. */
export function verifiedLocally(
	cards: CardView[],
	cardId: Id<"cards">,
	at: number,
): CardView[] {
	return cards.map((card) =>
		card._id === cardId
			? {
					...card,
					status: "done" as const,
					verifiedAt: at,
					selfVerified: false,
				}
			: card,
	);
}
