import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/**
 * Accept, decline (the contributor) or withdraw (a Founder) one Offer at a
 * time; a refusal shows the backend's words.
 */
export function useRespondToOffer() {
	const acceptOffer = useMutation(api.hiring.offers.accept);
	const declineOffer = useMutation(api.hiring.offers.decline);
	const withdrawOffer = useMutation(api.hiring.offers.withdraw);
	const [pendingId, setPendingId] = useState<Id<"offers"> | null>(null);

	async function run(
		offerId: Id<"offers">,
		action: () => Promise<unknown>,
		success: string,
	): Promise<boolean> {
		if (pendingId) {
			return false;
		}
		setPendingId(offerId);
		try {
			await action();
			toast.success(success);
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update the Offer"));
			return false;
		} finally {
			setPendingId(null);
		}
	}

	return {
		pendingId,
		accept: (offerId: Id<"offers">) =>
			run(offerId, () => acceptOffer({ offerId }), "Welcome to the team"),
		decline: (offerId: Id<"offers">) =>
			run(offerId, () => declineOffer({ offerId }), "Offer declined"),
		withdraw: (offerId: Id<"offers">) =>
			run(offerId, () => withdrawOffer({ offerId }), "Offer withdrawn"),
	};
}
