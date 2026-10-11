import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** A published Hackathon as anyone sees it, with your application; `null` when the id isn't one. */
export function useHackathon(hackathonId: string) {
	return useQuery(api.hiring.hackathons.getPublic, { hackathonId });
}
