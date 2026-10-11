import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type HiringRow = FunctionReturnType<
	typeof api.hiring.hackathons.list
>[number];

/** The Hiring tab's groups. Contributors never see drafts. */
export function groupHackathons(rows: HiringRow[], isFounder: boolean) {
	return {
		now: rows.filter((row) =>
			["open", "building", "deciding"].includes(row.status),
		),
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
		case "building":
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

/** "promises kept 3/3", once any Builder answered. */
export function promiseLine(row: HiringRow): string | null {
	return row.promisesAnswered > 0
		? `promises kept ${row.promisesKept}/${row.promisesAnswered}`
		: null;
}
