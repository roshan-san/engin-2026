import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import type { BoardScope } from "~/entities/card";
import { attempt } from "~/shared/lib/errors";

/** Adds a Card to To do, on Startup Boards only. Resolves `false` when it wasn't created (the error is toasted). */
export function useCreateCard(scope: BoardScope) {
	const createCard = useMutation(api.cards.create);

	return async function create(title: string) {
		if (scope.kind !== "startup") return false;
		return attempt(() => createCard({ startupId: scope.startupId, title }));
	};
}
