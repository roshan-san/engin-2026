import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Editing and deleting a Card. Each resolves `false` when it failed (the error is toasted). */
export function useCardActions() {
	const updateCard = useMutation(api.work.cards.update);
	const removeCard = useMutation(api.work.cards.remove);

	async function update(
		cardId: Id<"cards">,
		patch: { title?: string; notes?: string; ownerId?: Id<"users"> },
	) {
		return attempt(() => updateCard({ cardId, ...patch }));
	}

	async function remove(cardId: Id<"cards">) {
		return attempt(() => removeCard({ cardId }));
	}

	return { update, remove };
}
