import type { api } from "@convex/_generated/api";
import { WEEK_COUNT_CAP } from "@convex/lib/limits";
import { WEEK_MS } from "@convex/work/cycles.rules";
import type { FunctionReturnType } from "convex/server";
import { roleLabel } from "~/features/hiring/jobChips";
import { cycleDates } from "../board/cycleDates";
import { displayName } from "../cards/displayName";

export type ActivityView = FunctionReturnType<typeof api.work.activity.list>;
export type CycleView = ActivityView["cycles"][number];
export type EntryView = CycleView["entries"][number];
export type SignalsView = NonNullable<
	FunctionReturnType<typeof api.work.activity.getSignals>
>;
export type StripCell = SignalsView["strip"][number];

const WEEKDAY = new Intl.DateTimeFormat("en-US", {
	timeZone: "Asia/Kolkata",
	weekday: "short",
});

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
	return `${cycleDates(cell.startsAt, cell.startsAt + WEEK_MS)} · ${count} verified`;
}

/** One Activity line, e.g. "Priya · Sent welcome sequence · verified · Tue". */
export function entryText(entry: EntryView): string {
	const actor = displayName(entry.actor);
	const job = entry.job ? roleLabel(entry.job.role) : "a job";
	switch (entry.kind) {
		case "card_verified": {
			const verified = entry.selfVerified ? "Self-verified" : "verified";
			return `${actor} · ${entry.line ?? ""} · ${verified} · ${WEEKDAY.format(entry.at)}`;
		}
		case "contributor_joined":
			return `${actor} joined`;
		case "hackathon_finished":
			return `Hackathon finished · ${job}`;
		case "builder_hired":
			return `Hired ${actor} · ${job}`;
	}
}
