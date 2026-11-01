import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type CycleReview = NonNullable<
	FunctionReturnType<typeof api.cycles.getReview>
>;

/** The Monday review the Founder has due; `null` when none is, `undefined` while loading. */
export function useReview(startupId: Id<"startups">) {
	return useQuery(api.cycles.getReview, { startupId });
}
