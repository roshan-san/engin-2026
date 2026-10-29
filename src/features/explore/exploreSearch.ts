import type {
	startupCategory,
	startupCity,
	startupStage,
} from "@convex/shared/validators";
import type { Infer } from "convex/values";
import { CITIES, KINDS, STAGES } from "~/features/startups";
import { type JobRole, ROLES } from "~/shared/config/jobs";

type Stage = Infer<typeof startupStage>;
type Category = Infer<typeof startupCategory>;
type City = Infer<typeof startupCity>;

export type HackathonSearch = {
	role?: JobRole;
	weeks?: 1 | 2;
	paid?: true;
};

export type StartupSearch = {
	stage?: Stage;
	category?: Category;
	city?: City;
};

/** The chip value, or nothing when the URL carries something else. */
function pickChip<T extends string>(
	chips: readonly { readonly value: T }[],
	raw: unknown,
): T | undefined {
	return chips.find((chip) => chip.value === raw)?.value;
}

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

/** Startup filters from the URL. Unknown values become `undefined`. */
export function parseStartupSearch(
	raw: Record<string, unknown>,
): StartupSearch {
	const stage = pickChip(STAGES, raw.stage);
	const category = pickChip(KINDS, raw.category);
	const city = pickChip(CITIES, raw.city);

	return { stage, category, city };
}

/** True when any filter is on. The parsers set every key, so an off filter is a key holding `undefined`. */
export function hasFilters(search: HackathonSearch | StartupSearch): boolean {
	return Object.values(search).some((value) => value !== undefined);
}
