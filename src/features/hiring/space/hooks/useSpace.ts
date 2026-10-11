import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { roleLabel } from "../../jobChips";

/** The Founder's Hackathon and its template Cards; `null` for anyone else or a bad id. */
export function useSpace(hackathonId: string) {
	return useQuery(api.hiring.hackathons.get, { hackathonId });
}

/** The job role for the top bar's `›` crumb, once loaded. */
export function useHackathonCrumb(hackathonId: string | undefined) {
	const space = useQuery(
		api.hiring.hackathons.get,
		hackathonId ? { hackathonId } : "skip",
	);
	return space ? roleLabel(space.hackathon.job.role) : undefined;
}

/** Everyone, then the private threads the viewer can open. */
export function useHackathonThreads(hackathonId: Id<"hackathons">) {
	return useQuery(api.chat.threads.list, { hackathonId });
}
