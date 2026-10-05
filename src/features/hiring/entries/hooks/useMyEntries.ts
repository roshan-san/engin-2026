import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** The signed-in contributor's entries, newest first, split by whether they're live. */
export function useMyEntries() {
	const entries = useQuery(api.hiring.applications.listMine);

	return {
		entries,
		live: entries?.filter((entry) => entry.isLive) ?? [],
		past: entries?.filter((entry) => !entry.isLive) ?? [],
	};
}
