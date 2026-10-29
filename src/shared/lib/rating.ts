import type { api } from "@convex/_generated/api";
import { WEEK_MS } from "@convex/cycles/rules";
import { WEEK_COUNT_CAP } from "@convex/shared/limits";
import type { FunctionReturnType } from "convex/server";
import { dateRange } from "./dates";

/** One week of the 12-week strip under a Rating. */
export type StripCell = NonNullable<
	FunctionReturnType<typeof api.activity.getSignals>
>["strip"][number];

/** "▲ 12" up, "▼ 8" down, nothing when flat. Never red. */
export function ratingChangeLabel(change: number): {
	text: string;
	direction: "up" | "down" | "flat";
} {
	if (change > 0) return { text: `▲ ${change}`, direction: "up" };
	if (change < 0) return { text: `▼ ${-change}`, direction: "down" };
	return { text: "", direction: "flat" };
}

/** A strip cell's shade: null before Engin, 0 for a quiet week, up to 4. */
export function stripLevel(count: number | null): 0 | 1 | 2 | 3 | 4 | null {
	if (count === null) return null;
	if (count === 0) return 0;
	if (count === 1) return 1;
	if (count <= 3) return 2;
	if (count <= 5) return 3;
	return 4;
}

export function stripTooltip(cell: Pick<StripCell, "startsAt" | "count">) {
	if (cell.count === null) return "Before Engin";
	const count =
		cell.count >= WEEK_COUNT_CAP ? `${WEEK_COUNT_CAP}+` : cell.count;
	return `${dateRange(cell.startsAt, cell.startsAt + WEEK_MS)} · ${count} verified`;
}
