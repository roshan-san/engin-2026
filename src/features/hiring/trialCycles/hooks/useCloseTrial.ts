import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Verdict } from "~/features/hiring/trialCycles/constants";
import { toErrorMessage } from "~/lib/validation";

export type VerdictInput = {
	applicationId: Id<"applications">;
	verdict: Verdict;
	evaluation?: string;
};

/** Closes a running hackathon with every Participant's Verdict; all or nothing. */
export function useCloseTrial(trialCycleId: Id<"trialCycles">) {
	const closeTrial = useMutation(api.hiring.trialCycles.close);
	const [isPending, setIsPending] = useState(false);

	async function close(verdicts: VerdictInput[]): Promise<boolean> {
		if (isPending) {
			return false;
		}
		setIsPending(true);
		try {
			await closeTrial({ trialCycleId, verdicts });
			toast.success("Trial Cycle closed");
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not close Trial Cycle"));
			return false;
		} finally {
			setIsPending(false);
		}
	}

	return { close, isPending };
}
