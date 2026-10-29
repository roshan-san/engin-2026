import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type PresenceView = FunctionReturnType<typeof api.presence.list>[number];

/** Who is online on the Startup right now. */
export function useOnline(
	startupId: Id<"startups">,
): PresenceView[] | undefined {
	return useQuery(api.presence.list, { startupId });
}
