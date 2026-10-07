import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** One thread: its Hackathon heading and Announcements, read-only. */
export function useThread(hackathonId: string) {
	const thread = useQuery(api.hiring.announcements.getThread, {
		hackathonId: hackathonId as Id<"hackathons">,
	});
	return { thread };
}
