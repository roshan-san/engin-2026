import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type SignalsView = NonNullable<
	FunctionReturnType<typeof api.activity.getSignals>
>;

/** A Startup's Rating, parts and rhythm strip; `null` for an unknown slug. */
export function useSignals(slug: string | undefined) {
	return useQuery(api.activity.getSignals, slug ? { slug } : "skip");
}
