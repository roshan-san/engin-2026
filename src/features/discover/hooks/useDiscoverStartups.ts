import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";

export function useDiscoverStartups() {
	const [term, setTerm] = useState("");
	const results = useQuery(api.teams.explore.search, {
		term: term || undefined,
	});

	return {
		term,
		setTerm,
		results,
	};
}
