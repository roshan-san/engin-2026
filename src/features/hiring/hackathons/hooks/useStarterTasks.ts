import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/** A hackathon's Starter Tasks for Startup members, with the Founder's add and remove. */
export function useStarterTasks(hackathonId: Id<"hackathons">) {
	const starterTasks = useQuery(api.hiring.hackathons.listStarterTasks, {
		hackathonId,
	});
	const addStarterTask = useMutation(api.hiring.hackathons.addStarterTask);
	const removeStarterTask = useMutation(
		api.hiring.hackathons.removeStarterTask,
	);
	const [isPending, setIsPending] = useState(false);

	async function run(action: () => Promise<unknown>): Promise<boolean> {
		if (isPending) {
			return false;
		}
		setIsPending(true);
		try {
			await action();
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update Starter Tasks"));
			return false;
		} finally {
			setIsPending(false);
		}
	}

	return {
		starterTasks,
		isPending,
		add: (title: string, description: string) =>
			run(() => addStarterTask({ hackathonId, title, description })),
		remove: (taskId: Id<"tasks">) => run(() => removeStarterTask({ taskId })),
	};
}
