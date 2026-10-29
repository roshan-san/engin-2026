import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Saves this week's goal and resolves whether it saved; toasts the error instead of throwing. */
export function useSetGoal(startupId: Id<"startups">) {
	const setGoal = useMutation(api.work.cycles.setGoal);

	return async (goal: string): Promise<boolean> => {
		return attempt(() => setGoal({ startupId, goal }));
	};
}
