import type { PulseStatus } from "~/features/work/pulses/constants";

export type KanbanMove =
	| { kind: "status"; status: PulseStatus }
	| { kind: "verify" }
	| { kind: "return" };

/**
 * Mirrors the backend's rules so refused drops can be shown before they are
 * sent: anyone moves work up to review; only a Founder takes it out of review.
 */
export function kanbanMove(
	from: PulseStatus,
	to: PulseStatus,
	isFounder: boolean,
): KanbanMove | { kind: "refused"; reason: string } | null {
	if (from === to) {
		return null;
	}
	if (from === "done") {
		return { kind: "refused", reason: "Verified Pulses are final" };
	}
	if (from === "review") {
		if (!isFounder) {
			return { kind: "refused", reason: "This Pulse is awaiting review" };
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
			reason: "Only a Founder can verify a Pulse, once it is in review",
		};
	}
	return { kind: "status", status: to };
}

export function canDrop(
	from: PulseStatus,
	to: PulseStatus,
	isFounder: boolean,
): boolean {
	const move = kanbanMove(from, to, isFounder);
	return move !== null && move.kind !== "refused";
}
