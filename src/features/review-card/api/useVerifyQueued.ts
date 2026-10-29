import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useMemo } from "react";
import { attempt } from "~/shared/lib/errors";

/** Verifies a Card from the Review queue; it leaves the queue at once, so V can't verify it twice. Resolves `false` after toasting a failure. */
export function useVerifyQueued(hackathonId: Id<"hackathons">) {
	const verifyCard = useMutation(api.cards.verify);
	const verifyOptimistically = useMemo(
		() =>
			verifyCard.withOptimisticUpdate((store, args) => {
				const current = store.getQuery(api.cards.listReviewQueue, {
					hackathonId,
				});
				if (current) {
					store.setQuery(
						api.cards.listReviewQueue,
						{ hackathonId },
						current.filter((card) => card._id !== args.cardId),
					);
				}
			}),
		[verifyCard, hackathonId],
	);

	return async function verify(cardId: Id<"cards">) {
		return attempt(() => verifyOptimistically({ cardId }));
	};
}
