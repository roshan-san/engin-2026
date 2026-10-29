import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** This week's Cycle: number, dates and goal; `undefined` while loading. */
export function useCycle(startupId: Id<"startups">) {
	return useQuery(api.cycles.getCurrent, { startupId });
}
