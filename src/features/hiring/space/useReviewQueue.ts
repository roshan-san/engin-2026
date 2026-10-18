import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Every Participant Card waiting in Review, oldest submission first, and Verify. */
export function useReviewQueue(hackathonId: Id<"hackathons">) {
	const queue = useQuery(api.work.cards.listReviewQueue, { hackathonId });
	const verifyCard = useMutation(api.work.cards.verify);
	// The Card leaves the queue at once, so V can't verify it twice.
	const verifyOptimistically = useMemo(
		() =>
			verifyCard.withOptimisticUpdate((store, args) => {
				const current = store.getQuery(api.work.cards.listReviewQueue, {
					hackathonId,
				});
				if (current) {
					store.setQuery(
						api.work.cards.listReviewQueue,
						{ hackathonId },
						current.filter((card) => card._id !== args.cardId),
					);
				}
			}),
		[verifyCard, hackathonId],
	);

	/** Resolves `false` after toasting a failure. */
	async function verify(cardId: Id<"cards">) {
		try {
			await verifyOptimistically({ cardId });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { queue, verify };
}
