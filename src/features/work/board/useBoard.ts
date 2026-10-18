import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { attempt } from "~/lib/errors";
import { type BoardScope, boardQuery } from "./BoardScope";
import type { CardView } from "./types";
import { verifiedLocally } from "./verifiedLocally";

/** Rewrites the scope's cached Cards, for optimistic updates. */
export function patchBoardCards(
	store: OptimisticLocalStore,
	scope: BoardScope,
	patch: (cards: CardView[]) => CardView[],
) {
	const query = boardQuery(scope);
	if (query.kind === "startup") {
		const current = store.getQuery(api.work.cards.listBoard, query.args);
		if (current) {
			store.setQuery(api.work.cards.listBoard, query.args, patch(current));
		}
		return;
	}
	const current = store.getQuery(
		api.work.cards.listParticipantBoard,
		query.args,
	);
	if (current) {
		store.setQuery(
			api.work.cards.listParticipantBoard,
			query.args,
			patch(current),
		);
	}
}

/** The scope's Cards; `undefined` while loading. */
export function useBoardCards(scope: BoardScope): CardView[] | undefined {
	const query = boardQuery(scope);
	const startupCards = useQuery(
		api.work.cards.listBoard,
		query.kind === "startup" ? query.args : "skip",
	);
	const participantCards = useQuery(
		api.work.cards.listParticipantBoard,
		query.kind === "participant" ? query.args : "skip",
	);
	return query.kind === "startup" ? startupCards : participantCards;
}

/** The Board's Cards: creating (Startup Boards only), moving between To do and In progress, and Verify. */
export function useBoard(scope: BoardScope) {
	const cards = useBoardCards(scope);
	const createCard = useMutation(api.work.cards.create);
	const moveCard = useMutation(api.work.cards.move);
	const verifyCard = useMutation(api.work.cards.verify);
	const moveOptimistically = useMemo(
		() =>
			moveCard.withOptimisticUpdate((store, args) => {
				patchBoardCards(store, scope, (current) =>
					current.map((card) =>
						card._id === args.cardId ? { ...card, status: args.to } : card,
					),
				);
			}),
		[moveCard, scope],
	);
	const verifyOptimistically = useMemo(
		() =>
			verifyCard.withOptimisticUpdate((store, args) => {
				patchBoardCards(store, scope, (current) =>
					verifiedLocally(current, args.cardId, Date.now()),
				);
			}),
		[verifyCard, scope],
	);

	/** Resolves `false` when the Card wasn't created (the error is toasted). */
	async function create(title: string) {
		if (scope.kind !== "startup") return false;
		return attempt(() => createCard({ startupId: scope.startupId, title }));
	}

	/** Resolves `false` when it failed (the error is toasted). */
	async function move(cardId: Id<"cards">, to: "todo" | "in_progress") {
		return attempt(() => moveOptimistically({ cardId, to }));
	}

	/** Founder only, from Review. Toasts the success; resolves `false` when it failed (the error is toasted). */
	async function verify(card: Pick<CardView, "_id" | "title">) {
		return attempt(async () => {
			await verifyOptimistically({ cardId: card._id });
			toast.success(`Verified · ${card.title}`);
		});
	}

	return { cards, create, move, verify };
}
