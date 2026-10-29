import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useMemo } from "react";
import { landsIn, patchBoardCards, useBoardScope } from "~/entities/card";
import { attempt } from "~/shared/lib/errors";

export type Shipped = {
	line: string;
	links: string[];
	images: Id<"_storage">[];
};

/** Submitting a Card with What shipped: to Review, or Done when the Founder owns it. */
export function useSubmit() {
	const scope = useBoardScope();
	const submitCard = useMutation(api.cards.submit);
	const submitOptimistically = useMemo(
		() =>
			submitCard.withOptimisticUpdate((store, args) => {
				patchBoardCards(store, scope, (current) =>
					current.map((card) => {
						if (card._id !== args.cardId) return card;
						return landsIn(card, scope) === "done"
							? { ...card, status: "done" as const, selfVerified: true }
							: { ...card, status: "review" as const };
					}),
				);
			}),
		[submitCard, scope],
	);

	/** Resolves `false` when it wasn't submitted (the error is toasted). */
	async function submit(cardId: Id<"cards">, shipped: Shipped) {
		return attempt(() => submitOptimistically({ cardId, shipped }));
	}

	return { submit };
}
