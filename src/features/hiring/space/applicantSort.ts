import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type ApplicantRow = FunctionReturnType<
	typeof api.hiring.applications.listForHackathon
>[number];

const GROUP = { building: 0, applied: 1, declined: 2, left: 2 } as const;

/** Builders first, then Applicants, then the rest; newest first or by Rating. */
export function sortApplicants(
	rows: ApplicantRow[],
	by: "newest" | "rating",
): ApplicantRow[] {
	return [...rows].sort(
		(a, b) =>
			GROUP[a.application.status] - GROUP[b.application.status] ||
			(by === "rating" ? b.user.rating - a.user.rating : 0) ||
			b.application._creationTime - a.application._creationTime,
	);
}
