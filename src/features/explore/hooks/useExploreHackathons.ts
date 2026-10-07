import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";

/** Open hackathons of public startups; drafts and stealth never come back. */
export function useExploreHackathons() {
	const [term, setTerm] = useState("");
	const results = useQuery(api.hiring.opportunities.search, {
		term: term || undefined,
	});

	return { term, setTerm, hackathons: results?.hackathons };
}
