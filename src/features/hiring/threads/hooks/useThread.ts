import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** One thread: its Trial Cycle heading and Announcements, read-only. */
export function useThread(trialCycleId: string) {
	const thread = useQuery(api.hiring.announcements.getThread, {
		trialCycleId: trialCycleId as Id<"trialCycles">,
	});
	return { thread };
}
