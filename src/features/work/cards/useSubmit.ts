import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";
import { useBoardScope } from "../board/BoardScope";
import { patchBoardCards } from "../board/useBoard";

export type Shipped = {
	line: string;
	links: string[];
	images: Id<"_storage">[];
};

/** Submitting a Card with What shipped: to Review, or Done when the Founder owns it. */
export function useSubmit() {
	const scope = useBoardScope();
	const submitCard = useMutation(api.work.cards.submit);
	const submitOptimistically = useMemo(
		() =>
			submitCard.withOptimisticUpdate((store, args) => {
				patchBoardCards(store, scope, (current) =>
					current.map((card) => {
						if (card._id !== args.cardId) return card;
						const goesStraightToDone =
							scope.isFounder && card.owner?._id === scope.userId;
						return goesStraightToDone
							? { ...card, status: "done" as const, selfVerified: true }
							: { ...card, status: "review" as const };
					}),
				);
			}),
		[submitCard, scope],
	);

	/** Resolves `false` when it wasn't submitted (the error is toasted). */
	async function submit(cardId: Id<"cards">, shipped: Shipped) {
		try {
			await submitOptimistically({ cardId, shipped });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { submit };
}
