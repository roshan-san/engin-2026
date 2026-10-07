import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { kanbanMove } from "~/features/work/cycles/lib/kanban";
import {
	inferProofLinkKind,
	type TaskStatus,
} from "~/features/work/tasks/constants";
import { toErrorMessage } from "~/lib/validation";

/** A Task on a board, team or hackathon. Review cards from a Participant who left say so. */
export type CycleTask = FunctionReturnType<
	typeof api.work.tasks.listForCycle
>[number] & { assigneeLeft?: boolean };

/** What a drop asked for: done, or a Founder's return that needs a note. */
export type MoveOutcome = "sent" | "needs_note" | "refused" | "none";

/** A team Cycle's Tasks and every board action. */
export function useCycleTasks(cycleId: Id<"cycles">, isFounder: boolean) {
	const tasks: CycleTask[] | undefined = useQuery(api.work.tasks.listForCycle, {
		cycleId,
	});
	return { tasks, ...useBoardActions(cycleId, isFounder) };
}

/**
 * Every board action on one Cycle, with one pending Task at a time. Refusals
 * show the backend's words.
 */
export function useBoardActions(cycleId: Id<"cycles">, isFounder: boolean) {
	const createTask = useMutation(api.work.tasks.create);
	const assignToMe = useMutation(api.work.tasks.assignToMe);
	const setStatus = useMutation(api.work.tasks.setStatus);
	const verify = useMutation(api.work.tasks.verify);
	const reject = useMutation(api.work.tasks.reject);
	const updateTask = useMutation(api.work.tasks.update);
	const removeTask = useMutation(api.work.tasks.remove);
	const addLink = useMutation(api.work.tasks.addProofLink);
	const removeLink = useMutation(api.work.tasks.removeProofLink);
	const [pendingId, setPendingId] = useState<Id<"tasks"> | "new" | null>(null);

	async function run(
		taskId: Id<"tasks"> | "new",
		action: () => Promise<unknown>,
	): Promise<boolean> {
		setPendingId(taskId);
		try {
			await action();
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update Task"));
			return false;
		} finally {
			setPendingId(null);
		}
	}

	/** Sends an allowed move; a refused one is toasted with its rule. */
	function move(task: CycleTask, to: TaskStatus): MoveOutcome {
		const taskId = task._id;
		const next = kanbanMove(
			task.status,
			to,
			isFounder,
			task.proofLinks.length > 0,
		);
		if (!next) {
			return "none";
		}
		if (next.kind === "refused") {
			toast.error(next.reason);
			return "refused";
		}
		if (next.kind === "return") {
			return "needs_note";
		}
		if (next.kind === "verify") {
			void run(taskId, () => verify({ taskId }));
			return "sent";
		}
		void run(taskId, () => setStatus({ taskId, status: next.status }));
		return "sent";
	}

	return {
		pendingId,
		move,
		returnWithNote: (taskId: Id<"tasks">, note: string) =>
			run(taskId, () => reject({ taskId, note })),
		take: (taskId: Id<"tasks">) => run(taskId, () => assignToMe({ taskId })),
		create: (startupId: Id<"startups">, title: string) =>
			run("new", () => createTask({ startupId, cycleId, title })),
		edit: (taskId: Id<"tasks">, title: string, description: string) =>
			run(taskId, () => updateTask({ taskId, title, description })),
		remove: (taskId: Id<"tasks">) => run(taskId, () => removeTask({ taskId })),
		verify: (taskId: Id<"tasks">) => run(taskId, () => verify({ taskId })),
		addProofLink: (taskId: Id<"tasks">, url: string) =>
			run(taskId, () =>
				addLink({ taskId, url, kind: inferProofLinkKind(url) }),
			),
		removeProofLink: (taskId: Id<"tasks">, url: string) =>
			run(taskId, () => removeLink({ taskId, url })),
	};
}
