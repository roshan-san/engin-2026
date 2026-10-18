import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** The Participant's one tap: did the Founder do what they promised? Resolves to whether it saved. */
export function useKeepPromise(applicationId: Id<"applications">) {
	const keepPromise = useMutation(api.hiring.applications.keepPromise);

	return async (kept: boolean): Promise<boolean> => {
		try {
			await keepPromise({ applicationId, kept });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	};
}
