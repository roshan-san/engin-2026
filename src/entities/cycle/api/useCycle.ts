import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMinute } from "~/shared/lib/minute";

/** This week's Cycle: number, dates, the lock and the meetings; `undefined` while loading. Re-reads as each minute turns, so the lock shows on time. */
export function useCycle(startupId: Id<"startups">) {
	const now = useMinute();
	return useQuery(api.cycles.getCurrent, { startupId, now });
}
