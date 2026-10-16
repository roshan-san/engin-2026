import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { BoardScope } from "../board/BoardScope";
import type { CardView } from "../board/types";
import { useBoardCards } from "../board/useBoard";

/**
 * One Card: taken from the Board's data when it's on the Board, else fetched
 * (a Card verified in an earlier Cycle). A Builder's Board holds all their
 * Cards, so there a Card not in the list is missing. `null` when it isn't
 * here, `undefined` while loading.
 */
export function useCard(
	scope: BoardScope,
	cardId: string,
): CardView | null | undefined {
	const cards = useBoardCards(scope);
	const onBoard = cards?.find((card) => card._id === cardId);
	const fetched = useQuery(
		api.work.cards.get,
		scope.kind === "startup" && cards && !onBoard
			? { startupId: scope.startupId, cardId }
			: "skip",
	);

	if (!cards) return undefined;
	if (onBoard) return onBoard;
	return scope.kind === "startup" ? fetched : null;
}
