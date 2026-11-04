import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** The plan the Startup publishes on, its Founder's, and whether its payment failed; undefined while loading. */
export function useStartupPlan(startupId: Id<"startups">) {
	return useQuery(api.billing.forStartup, { startupId });
}
