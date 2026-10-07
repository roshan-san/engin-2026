import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

/** A hackathon's Announcements, newest first, and the Founder's post. */
export function useAnnouncements(
	hackathonId: Id<"hackathons">,
	enabled: boolean,
) {
	const announcements = useQuery(
		api.hiring.announcements.list,
		enabled ? { hackathonId } : "skip",
	);
	const postAnnouncement = useMutation(api.hiring.announcements.post);

	return {
		announcements,
		post: (body: string) => postAnnouncement({ hackathonId, body }),
	};
}
