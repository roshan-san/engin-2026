import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useRef } from "react";
import {
	keepWhileLoading,
	type LoadingCache,
} from "~/shared/lib/keepWhileLoading";
import { useMinute } from "~/shared/lib/minute";

type Cycle = FunctionReturnType<typeof api.cycles.getCurrent>;

/**
 * This week's Cycle: number, dates, the lock and the meetings; `undefined` while
 * first loading. Re-reads as each minute turns, so the lock shows on time, and
 * keeps the last result meanwhile, so nothing blinks.
 */
export function useCycle(startupId: Id<"startups">) {
	const now = useMinute();
	const cache = useRef<LoadingCache<Cycle>>({});
	const cycle = useQuery(api.cycles.getCurrent, { startupId, now });
	return keepWhileLoading(cache.current, startupId, cycle);
}
