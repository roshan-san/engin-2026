import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/** A hackathon's Challenges for Startup members, with the Founder's add and remove. */
export function useTrialChallenges(trialCycleId: Id<"trialCycles">) {
	const challenges = useQuery(api.hiring.challenges.list, { trialCycleId });
	const addChallenge = useMutation(api.hiring.challenges.add);
	const removeChallenge = useMutation(api.hiring.challenges.remove);
	const [isPending, setIsPending] = useState(false);

	async function run(action: () => Promise<unknown>): Promise<boolean> {
		if (isPending) {
			return false;
		}
		setIsPending(true);
		try {
			await action();
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update Challenges"));
			return false;
		} finally {
			setIsPending(false);
		}
	}

	return {
		challenges,
		isPending,
		add: (title: string, description: string) =>
			run(() => addChallenge({ trialCycleId, title, description })),
		remove: (challengeId: Id<"challenges">) =>
			run(() => removeChallenge({ challengeId })),
	};
}
