import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Every Trial Cycle whose Announcements the user reads, newest activity first. */
export function useThreads() {
	const threads = useQuery(api.hiring.announcements.listThreads, {});
	return { threads };
}
