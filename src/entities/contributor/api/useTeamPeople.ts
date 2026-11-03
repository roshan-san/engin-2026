import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type TeamPeople = FunctionReturnType<typeof api.contributors.list>;
export type TeamPerson = TeamPeople["contributors"][number];

/** The Founder and Contributors of the Startup; `undefined` while loading, or with no Startup. */
export function useTeamPeople(startupId: Id<"startups"> | undefined) {
	return useQuery(api.contributors.list, startupId ? { startupId } : "skip");
}
