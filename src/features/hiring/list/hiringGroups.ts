import type { api } from "@convex/_generated/api";
import { isRunning } from "@convex/shared/hackathonPhase";
import type { FunctionReturnType } from "convex/server";

export type HiringRow = FunctionReturnType<
	typeof api.hiring.hackathons.list
>[number];

/** The Hiring tab's groups. Contributors never see drafts. */
export function groupHackathons(rows: HiringRow[], isFounder: boolean) {
	return {
		now: rows.filter((row) => isRunning(row.status)),
		drafts: isFounder ? rows.filter((row) => row.status === "draft") : [],
		past: rows.filter((row) => row.status === "done"),
	};
}

/** The one number that matters for the row's stage. */
export function rowNumber(row: HiringRow): string {
	switch (row.status) {
		case "draft":
			return "Draft";
		case "open":
			return `${row.applicantCount} applied`;
		case "live":
			return `${row.toReview} to review`;
		case "deciding":
			return `${row.toDecide} to decide`;
		case "done": {
			const parts = [];
			if (row.hires > 0) parts.push(`${row.hires} hired`);
			if (row.undecided > 0) parts.push(`${row.undecided} didn't decide`);
			return parts.length > 0 ? parts.join(" · ") : "No hire";
		}
	}
}

/** The row's number is waiting on the Founder: Cards to review, Participants to decide. */
export function needsYou(row: HiringRow): boolean {
	return (
		(row.status === "live" && row.toReview > 0) ||
		(row.status === "deciding" && row.toDecide > 0)
	);
}

/** "promises kept 3/3", once any Participant answered. */
export function promiseLine(row: HiringRow): string | null {
	return row.promisesAnswered > 0
		? `promises kept ${row.promisesKept}/${row.promisesAnswered}`
		: null;
}

/** The Hiring bar: "2 running · 1 draft · 1 past"; `null` with no Hackathons. */
export function hiringSummary(
	rows: HiringRow[],
	isFounder: boolean,
): string | null {
	const groups = groupHackathons(rows, isFounder);
	const parts = [
		groups.now.length > 0 ? `${groups.now.length} running` : null,
		groups.drafts.length > 0
			? `${groups.drafts.length} ${groups.drafts.length === 1 ? "draft" : "drafts"}`
			: null,
		groups.past.length > 0 ? `${groups.past.length} past` : null,
	].filter((part) => part !== null);
	return parts.length > 0 ? parts.join(" · ") : null;
}
