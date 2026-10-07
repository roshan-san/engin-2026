import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** The Startup's hackathons for the Hiring screen, newest first. */
export function useHiringScreen(startupId: Id<"startups"> | undefined) {
	const hackathons = useQuery(
		api.hiring.hackathons.list,
		startupId ? { startupId } : "skip",
	);

	return { hackathons, isLoading: hackathons === undefined };
}
