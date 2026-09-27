import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useActivityDashboard(startupId: Id<"startups"> | undefined) {
	const dashboard = useQuery(
		api.teams.activity.dashboard,
		startupId ? { startupId } : "skip",
	);

	return {
		dashboard,
		isLoading: dashboard === undefined,
	};
}
