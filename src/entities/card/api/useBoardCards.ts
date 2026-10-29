import { api } from "@convex/_generated/api";
import type { OptimisticLocalStore } from "convex/browser";
import { useQuery } from "convex/react";
import { type BoardScope, boardQuery } from "../model/BoardScope";
import type { CardView } from "../model/types";

/** Rewrites the scope's cached Cards, for optimistic updates. */
export function patchBoardCards(
	store: OptimisticLocalStore,
	scope: BoardScope,
	patch: (cards: CardView[]) => CardView[],
) {
	const query = boardQuery(scope);
	if (query.kind === "startup") {
		const current = store.getQuery(api.cards.listBoard, query.args);
		if (current) {
			store.setQuery(api.cards.listBoard, query.args, patch(current));
		}
		return;
	}
	const current = store.getQuery(api.cards.listParticipantBoard, query.args);
	if (current) {
		store.setQuery(api.cards.listParticipantBoard, query.args, patch(current));
	}
}

/** The scope's Cards; `undefined` while loading. */
export function useBoardCards(scope: BoardScope): CardView[] | undefined {
	const query = boardQuery(scope);
	const startupCards = useQuery(
		api.cards.listBoard,
		query.kind === "startup" ? query.args : "skip",
	);
	const participantCards = useQuery(
		api.cards.listParticipantBoard,
		query.kind === "participant" ? query.args : "skip",
	);
	return query.kind === "startup" ? startupCards : participantCards;
}
