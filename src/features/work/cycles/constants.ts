/** A Cycle shows "ending soon" within this window of its end date. */
export const CYCLE_ENDING_SOON_MS = 2 * 24 * 60 * 60 * 1000;

export type CycleUrgency = "overdue" | "ending_soon" | null;

export function cycleUrgency(
	endAt: number,
	status: "planned" | "active" | "closed",
): CycleUrgency {
	if (status !== "active") {
		return null;
	}
	const remaining = endAt - Date.now();
	if (remaining < 0) {
		return "overdue";
	}
	if (remaining <= CYCLE_ENDING_SOON_MS) {
		return "ending_soon";
	}
	return null;
}
