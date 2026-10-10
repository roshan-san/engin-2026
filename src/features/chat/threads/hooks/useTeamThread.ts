import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** The Startup's Team thread and whether it has messages you haven't read. */
export function useTeamThread(
	startupId: Id<"startups">,
): { _id: Id<"threads">; unread: boolean } | undefined {
	const threads = useQuery(api.chat.threads.list, { startupId });
	const team = threads?.find((thread) => thread.kind === "team");
	return team ? { _id: team._id, unread: team.unread } : undefined;
}
