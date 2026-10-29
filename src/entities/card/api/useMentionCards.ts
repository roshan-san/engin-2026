import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** The Board Cards a Team message can mention; empty outside Team. */
export function useMentionCards(startupId: Id<"startups"> | undefined) {
	return useQuery(api.cards.listBoard, startupId ? { startupId } : "skip");
}
