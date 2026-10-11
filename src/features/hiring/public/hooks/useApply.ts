import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Applying with an answer. Resolves `false` after toasting a failure. */
export function useApply(hackathonId: Id<"hackathons">) {
	const applyTo = useMutation(api.hiring.applications.apply);

	return async (answer: string) => {
		try {
			await applyTo({ hackathonId, answer });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	};
}
