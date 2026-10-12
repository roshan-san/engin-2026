import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** The Hackathon the bar's crumb names; skipped when there is no id. */
export function useCrumbHackathon(hackathonId: string | undefined) {
	return useQuery(
		api.hiring.hackathons.get,
		hackathonId ? { hackathonId } : "skip",
	);
}
