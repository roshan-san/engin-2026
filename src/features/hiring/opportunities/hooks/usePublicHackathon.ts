import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Takes the raw URL id; an unknown one comes back `null`. */
export function usePublicHackathon(hackathonId: string) {
	return useQuery(api.hiring.hackathons.getPublic, { hackathonId });
}
