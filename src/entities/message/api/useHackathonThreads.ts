import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** Everyone, then the private threads the viewer can open. `null` waits for the Hackathon. */
export function useHackathonThreads(hackathonId: Id<"hackathons"> | null) {
	return useQuery(api.threads.list, hackathonId ? { hackathonId } : "skip");
}
