import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** Everyone, then the private threads the viewer can open. */
export function useHackathonThreads(hackathonId: Id<"hackathons">) {
	return useQuery(api.chat.threads.list, { hackathonId });
}
