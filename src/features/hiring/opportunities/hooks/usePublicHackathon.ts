import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Takes the raw URL id; an unknown one comes back `null`. */
export function usePublicHackathon(trialCycleId: string) {
	return useQuery(api.hiring.trialCycles.getPublic, { trialCycleId });
}
