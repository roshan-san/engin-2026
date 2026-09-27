import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

export function useMyWork() {
	const pulses = useQuery(api.pulses.listMine);
	const cycles = useQuery(api.cycles.listMine);
	const applications = useQuery(api.hiring.applications.listMine);

	return {
		pulses,
		cycles,
		applications,
		isLoading:
			pulses === undefined ||
			cycles === undefined ||
			applications === undefined,
	};
}
