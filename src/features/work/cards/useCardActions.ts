import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Editing and deleting a Card. Each resolves `false` when it failed (the error is toasted). */
export function useCardActions() {
	const updateCard = useMutation(api.work.cards.update);
	const removeCard = useMutation(api.work.cards.remove);

	async function update(
		cardId: Id<"cards">,
		patch: { title?: string; notes?: string; ownerId?: Id<"users"> },
	) {
		try {
			await updateCard({ cardId, ...patch });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	async function remove(cardId: Id<"cards">) {
		try {
			await removeCard({ cardId });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { update, remove };
}
