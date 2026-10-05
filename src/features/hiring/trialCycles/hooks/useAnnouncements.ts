import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

/** A hackathon's Announcements, newest first, and the Founder's post. */
export function useAnnouncements(
	trialCycleId: Id<"trialCycles">,
	enabled: boolean,
) {
	const announcements = useQuery(
		api.hiring.announcements.list,
		enabled ? { trialCycleId } : "skip",
	);
	const postAnnouncement = useMutation(api.hiring.announcements.post);

	return {
		announcements,
		post: (body: string) => postAnnouncement({ trialCycleId, body }),
	};
}
