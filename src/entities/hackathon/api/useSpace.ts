import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** The Founder's Hackathon and its template Cards; `null` for anyone else or a bad id. */
export function useSpace(hackathonId: string) {
	return useQuery(api.hackathons.get, { hackathonId });
}
