import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

export function useMyWork() {
	const tasks = useQuery(api.work.tasks.listMine);
	const cycles = useQuery(api.work.cycles.listMine);
	const applications = useQuery(api.hiring.applications.listMine);

	return {
		tasks,
		cycles,
		applications,
		isLoading:
			tasks === undefined || cycles === undefined || applications === undefined,
	};
}
