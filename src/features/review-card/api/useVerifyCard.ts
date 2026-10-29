import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
	type BoardScope,
	type CardView,
	patchBoardCards,
	verifiedLocally,
} from "~/entities/card";
import { attempt } from "~/shared/lib/errors";

/** Founder only, from Review: verifies a Card on the Board at once and toasts it. Resolves `false` when it failed (the error is toasted). */
export function useVerifyCard(scope: BoardScope) {
	const verifyCard = useMutation(api.cards.verify);
	const verifyOptimistically = useMemo(
		() =>
			verifyCard.withOptimisticUpdate((store, args) => {
				patchBoardCards(store, scope, (current) =>
					verifiedLocally(current, args.cardId, Date.now()),
				);
			}),
		[verifyCard, scope],
	);

	return async function verify(card: Pick<CardView, "_id" | "title">) {
		return attempt(async () => {
			await verifyOptimistically({ cardId: card._id });
			toast.success(`Verified · ${card.title}`);
		});
	};
}
