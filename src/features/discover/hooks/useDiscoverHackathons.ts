import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Open hackathons of public startups; drafts and stealth never come back. */
export function useDiscoverHackathons() {
	const results = useQuery(api.hiring.opportunities.search, {});
	return results?.hackathons;
}
