import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** The Board's Cards, creating, and moving between To do and In progress. */
export function useBoard(startupId: Id<"startups">) {
	const cards = useQuery(api.work.cards.listBoard, { startupId });
	const createCard = useMutation(api.work.cards.create);
	const moveCard = useMutation(api.work.cards.move);
	const moveOptimistically = useMemo(
		() =>
			moveCard.withOptimisticUpdate((store, args) => {
				const current = store.getQuery(api.work.cards.listBoard, { startupId });
				if (!current) return;
				store.setQuery(
					api.work.cards.listBoard,
					{ startupId },
					current.map((card) =>
						card._id === args.cardId ? { ...card, status: args.to } : card,
					),
				);
			}),
		[moveCard, startupId],
	);

	async function create(title: string) {
		try {
			await createCard({ startupId, title });
		} catch (error) {
			toast.error(errorMessage(error));
		}
	}

	async function move(cardId: Id<"cards">, to: "todo" | "in_progress") {
		try {
			await moveOptimistically({ cardId, to });
		} catch (error) {
			toast.error(errorMessage(error));
		}
	}

	return { cards, create, move };
}
