import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** A Startup's Rating, parts and rhythm strip; `null` for an unknown slug. */
export function useSignals(slug: string | undefined) {
	return useQuery(api.work.activity.getSignals, slug ? { slug } : "skip");
}
