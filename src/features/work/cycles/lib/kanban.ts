import type { TaskStatus } from "~/features/work/tasks/constants";

export type KanbanMove =
	| { kind: "status"; status: TaskStatus }
	| { kind: "verify" }
	| { kind: "return" };

/** Shown while a Task with no proof link is dragged over Review, and on its menu item. */
export const ADD_PROOF_FIRST = "Add proof first";

/**
 * Mirrors the backend's rules (and its messages) so refused drops can be shown
 * before they are sent: anyone moves work up to review once it has proof;
 * only a Founder takes it out of review.
 */
export function kanbanMove(
	from: TaskStatus,
	to: TaskStatus,
	isFounder: boolean,
	hasProof: boolean,
): KanbanMove | { kind: "refused"; reason: string } | null {
	if (from === to) {
		return null;
	}
	if (from === "done") {
		return { kind: "refused", reason: "This Task is already verified" };
	}
	if (from === "review") {
		if (!isFounder) {
			return { kind: "refused", reason: "This Task is awaiting review" };
		}
		if (to === "done") {
			return { kind: "verify" };
		}
		if (to === "in_progress") {
			return { kind: "return" };
		}
		return {
			kind: "refused",
			reason: "Send it back to in progress with a note",
		};
	}
	if (to === "done") {
		return {
			kind: "refused",
			reason: "Only a Founder can verify a Task, once it is in review",
		};
	}
	if (to === "review" && !hasProof) {
		return { kind: "refused", reason: ADD_PROOF_FIRST };
	}
	return { kind: "status", status: to };
}

export function canDrop(
	from: TaskStatus,
	to: TaskStatus,
	isFounder: boolean,
	hasProof: boolean,
): boolean {
	const move = kanbanMove(from, to, isFounder, hasProof);
	return move !== null && move.kind !== "refused";
}
