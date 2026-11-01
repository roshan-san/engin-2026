import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Closes the review and resolves whether it did; toasts the error instead of throwing. */
export function useCloseReview(startupId: Id<"startups">) {
	const closeReview = useMutation(api.cycles.closeReview);

	return (args: {
		week: string;
		goalMet?: boolean;
		dropCardIds: string[];
		nextGoal?: string;
	}): Promise<boolean> =>
		attempt(() =>
			closeReview({
				...args,
				startupId,
				dropCardIds: args.dropCardIds as Id<"cards">[],
			}),
		);
}
