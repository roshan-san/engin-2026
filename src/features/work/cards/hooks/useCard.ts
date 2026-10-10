import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useBoard } from "../../board/hooks/useBoard";
import type { CardView } from "../../board/types";

/**
 * One Card: taken from the Board's data when it's on the Board, else fetched
 * (a Card verified in an earlier Cycle). `null` when it isn't on this
 * Startup, `undefined` while loading.
 */
export function useCard(
	startupId: Id<"startups">,
	cardId: string,
): CardView | null | undefined {
	const { cards } = useBoard(startupId);
	const onBoard = cards?.find((card) => card._id === cardId);
	const fetched = useQuery(
		api.work.cards.get,
		cards && !onBoard ? { startupId, cardId: cardId as Id<"cards"> } : "skip",
	);

	if (!cards) return undefined;
	return onBoard ?? fetched;
}
