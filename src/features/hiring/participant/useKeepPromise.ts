import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** The Participant's one tap: did the Founder do what they promised? */
export function useKeepPromise(applicationId: Id<"applications">) {
	const keepPromise = useMutation(api.hiring.applications.keepPromise);

	return async (kept: boolean) => {
		try {
			await keepPromise({ applicationId, kept });
		} catch (error) {
			toast.error(errorMessage(error));
		}
	};
}
