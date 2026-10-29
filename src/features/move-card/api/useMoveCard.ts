import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useMemo } from "react";
import { type BoardScope, patchBoardCards } from "~/entities/card";
import { attempt } from "~/shared/lib/errors";

/** Moves a Card between To do and In progress, on the Board at once. Resolves `false` when it failed (the error is toasted). */
export function useMoveCard(scope: BoardScope) {
	const moveCard = useMutation(api.cards.move);
	const moveOptimistically = useMemo(
		() =>
			moveCard.withOptimisticUpdate((store, args) => {
				patchBoardCards(store, scope, (current) =>
					current.map((card) =>
						card._id === args.cardId ? { ...card, status: args.to } : card,
					),
				);
			}),
		[moveCard, scope],
	);

	return async function move(cardId: Id<"cards">, to: "todo" | "in_progress") {
		return attempt(() => moveOptimistically({ cardId, to }));
	};
}
