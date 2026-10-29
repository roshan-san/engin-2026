import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** Every Participant Card waiting in Review, oldest submission first. */
export function useReviewQueue(hackathonId: Id<"hackathons">) {
	return useQuery(api.cards.listReviewQueue, { hackathonId });
}
