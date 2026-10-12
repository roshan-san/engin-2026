import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** The Startup's Hackathons for the Hiring tab, newest first. */
export function useHackathons(startupId: Id<"startups">) {
	return useQuery(api.hiring.hackathons.list, { startupId });
}
