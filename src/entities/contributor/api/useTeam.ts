import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** The Startup's team, Founder first and then Contributors; `undefined` while loading. */
export function useTeam(startupId: Id<"startups">) {
	const team = useQuery(api.contributors.list, { startupId });
	if (!team) return undefined;

	return team.founder
		? [team.founder, ...team.contributors]
		: team.contributors;
}
