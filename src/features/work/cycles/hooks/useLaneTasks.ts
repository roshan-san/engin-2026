import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
	type CycleTask,
	useBoardActions,
} from "~/features/work/cycles/hooks/useCycleTasks";

/** What a Founder's Review column holds: every lane, or the one picked. */
export type ReviewScope = "all" | "lane";

/** Every Task in Review across a hackathon's lanes; Founders only, so others pass null. */
export function useReviewQueue(cycleId: Id<"cycles"> | null) {
	const review = useQuery(
		api.work.tasks.listReview,
		cycleId ? { cycleId } : "skip",
	);
	const countByLane = new Map<Id<"users">, number>();
	for (const task of review?.tasks ?? []) {
		if (task.assigneeUserId) {
			countByLane.set(
				task.assigneeUserId,
				(countByLane.get(task.assigneeUserId) ?? 0) + 1,
			);
		}
	}
	return { review, countByLane };
}

type LaneTarget = {
	readonly cycleId: Id<"cycles">;
	/** The lane shown; null for a Founder before any lane exists. */
	readonly assigneeUserId: Id<"users"> | null;
	readonly isFounder: boolean;
	readonly scope: ReviewScope;
};

/**
 * One hackathon lane as a board. To do, In progress and Done come from the
 * lane; a Founder's Review comes from every lane (or this one), a
 * Participant's from their own.
 */
export function useLaneTasks({
	cycleId,
	assigneeUserId,
	isFounder,
	scope,
}: LaneTarget) {
	const lane = useQuery(
		api.work.tasks.listLane,
		!isFounder || assigneeUserId
			? { cycleId, assigneeUserId: assigneeUserId ?? undefined }
			: "skip",
	);
	const { review, countByLane } = useReviewQueue(isFounder ? cycleId : null);

	let tasks: CycleTask[] | undefined;
	if (!isFounder) {
		tasks = lane;
	} else if (review !== undefined && (lane !== undefined || !assigneeUserId)) {
		const reviewTasks = review.tasks
			.filter(
				(task) => scope === "all" || task.assigneeUserId === assigneeUserId,
			)
			.map((task) => ({ ...task, canDelete: false }));
		tasks = [
			...(lane ?? []).filter((task) => task.status !== "review"),
			...reviewTasks,
		];
	}

	return {
		tasks,
		countByLane,
		isReviewTruncated: review?.truncated ?? false,
		...useBoardActions(cycleId, isFounder),
	};
}
