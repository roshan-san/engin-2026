import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type MyTask = FunctionReturnType<typeof api.work.tasks.listMine>[number];
export type TaskToReview = FunctionReturnType<
	typeof api.work.tasks.listToReview
>[number];

/** The viewer's Tasks across Startups, grouped by where they stand, and a Founder's review queue. */
export function useMyTasks() {
	const tasks = useQuery(api.work.tasks.listMine);
	const toReview = useQuery(api.work.tasks.listToReview);

	return {
		tasks,
		toReview,
		open:
			tasks?.filter(
				(task) => task.status === "todo" || task.status === "in_progress",
			) ?? [],
		inReview: tasks?.filter((task) => task.status === "review") ?? [],
		done: tasks?.filter((task) => task.status === "done") ?? [],
	};
}
