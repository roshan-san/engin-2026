import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Saves this week's goal; toasts the error instead of throwing. */
export function useSetGoal(startupId: Id<"startups">) {
	const setGoal = useMutation(api.work.cycles.setGoal);

	return async (goal: string) => {
		try {
			await setGoal({ startupId, goal });
		} catch (error) {
			toast.error(errorMessage(error));
		}
	};
}
