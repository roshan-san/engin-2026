import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useTrialCycle(trialCycleId: string) {
	const trial = useQuery(api.hiring.trialCycles.get, {
		trialCycleId: trialCycleId as Id<"trialCycles">,
	});

	return { trial, isLoading: trial === undefined };
}
