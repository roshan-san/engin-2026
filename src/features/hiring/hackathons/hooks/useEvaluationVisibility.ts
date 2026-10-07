import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/** Shows or hides a Participant's evaluation on their public profile. */
export function useEvaluationVisibility(applicationId: Id<"applications">) {
	const setVisibility = useMutation(
		api.hiring.applications.setEvaluationVisibility,
	);
	const [isPending, setIsPending] = useState(false);

	async function setPublic(isPublic: boolean) {
		setIsPending(true);
		try {
			await setVisibility({ applicationId, isPublic });
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update your profile"));
		} finally {
			setIsPending(false);
		}
	}

	return { setPublic, isPending };
}
