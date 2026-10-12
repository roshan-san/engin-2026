import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** The Founder's Hackathon and its template Cards; `null` for anyone else or a bad id. */
export function useSpace(hackathonId: string) {
	return useQuery(api.hiring.hackathons.get, { hackathonId });
}

/** Everyone, then the private threads the viewer can open. */
export function useHackathonThreads(hackathonId: Id<"hackathons">) {
	return useQuery(api.chat.threads.list, { hackathonId });
}
