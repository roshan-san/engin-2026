import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/** Cancels a hackathon; a refusal shows the backend's message word for word. */
export function useCancelHackathon() {
	const cancelTrial = useMutation(api.hiring.trialCycles.cancel);
	const [isPending, setIsPending] = useState(false);

	async function cancel(trialCycleId: Id<"trialCycles">): Promise<boolean> {
		if (isPending) {
			return false;
		}
		setIsPending(true);
		try {
			await cancelTrial({ trialCycleId });
			toast.success("Hackathon cancelled");
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not cancel the hackathon"));
			return false;
		} finally {
			setIsPending(false);
		}
	}

	return { cancel, isPending };
}
