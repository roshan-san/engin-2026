import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Your plan and what's left of it: null without Pro, undefined while loading. */
export function usePlan() {
	return useQuery(api.billing.mine);
}
