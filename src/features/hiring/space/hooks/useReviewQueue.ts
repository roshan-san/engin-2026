import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Every Builder Card waiting in Review, oldest submission first, and Verify. */
export function useReviewQueue(hackathonId: Id<"hackathons">) {
	const queue = useQuery(api.work.cards.listReviewQueue, { hackathonId });
	const verifyCard = useMutation(api.work.cards.verify);

	/** Resolves `false` after toasting a failure. */
	async function verify(cardId: Id<"cards">) {
		try {
			await verifyCard({ cardId });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { queue, verify };
}
