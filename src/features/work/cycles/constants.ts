/** A Cycle shows "ending soon" within this window of its end date. */
export const CYCLE_ENDING_SOON_MS = 2 * 24 * 60 * 60 * 1000;

export type CycleUrgency = "overdue" | "ending_soon" | null;

export function cycleUrgency(endAt: number, status: CycleStatus): CycleUrgency {
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

export type CycleStatus = "planned" | "active" | "closed";

/** The Cycles screen's sections, in order. */
export const CYCLE_STATUS_GROUPS: { status: CycleStatus; label: string }[] = [
	{ status: "active", label: "Active" },
	{ status: "planned", label: "Planned" },
	{ status: "closed", label: "Closed" },
];

export function cycleStatusLabel(status: CycleStatus): string {
	return (
		CYCLE_STATUS_GROUPS.find((group) => group.status === status)?.label ??
		status
	);
}
