import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export function useWorkspace() {
	const workspace = useQuery(api.teams.startups.getWorkspace);
	const setActive = useMutation(api.teams.startups.setActive);

	const active = workspace?.active ?? null;
	const startups = workspace?.startups ?? [];

	return {
		workspace,
		active,
		startups,
		isLoading: workspace === undefined,
		hasStartups: startups.length > 0,
		setActiveStartup: (startupId: Id<"startups">) => setActive({ startupId }),
	};
}
