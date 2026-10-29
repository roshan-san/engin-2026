import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type StartupInvite = NonNullable<
	FunctionReturnType<typeof api.invites.list>
>[number];

/** The Founder's pending Invites for the Startup. The list is Founder-only on the server, so a Contributor skips it. */
export function useStartupInvites(
	startupId: Id<"startups">,
	isFounder: boolean,
) {
	return useQuery(api.invites.list, isFounder ? { startupId } : "skip");
}
