import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** This week's conversations, newest first; `undefined` while loading. */
export function useConversations(startupId: Id<"startups">) {
	return useQuery(api.conversations.listCurrent, { startupId });
}
