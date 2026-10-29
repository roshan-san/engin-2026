import { type JobRole, ROLES } from "~/shared/config/jobs";
import { pickChip } from "~/shared/lib/search";

export type HackathonSearch = {
	role?: JobRole;
	weeks?: 1 | 2;
	paid?: true;
};

/** 1 or 2, as the number the router decodes or as text. */
function parseWeeks(raw: unknown): 1 | 2 | undefined {
	if (typeof raw !== "number" && typeof raw !== "string") {
		return undefined;
	}
	const weeks = Number(raw);
	return weeks === 1 || weeks === 2 ? weeks : undefined;
}

/** Hackathon filters from the URL. Unknown values become `undefined`, so a bad link shows everything. */
export function parseHackathonSearch(
	raw: Record<string, unknown>,
): HackathonSearch {
	const role = pickChip(ROLES, raw.role);
	const weeks = parseWeeks(raw.weeks);
	// The router decodes `?paid=true` to a boolean; a hand-typed value may stay text.
	const paid = raw.paid === true || raw.paid === "true";

	// Every key is set, so a dropped value overrides the raw one the parent route passes down.
	return { role, weeks, paid: paid ? true : undefined };
}
