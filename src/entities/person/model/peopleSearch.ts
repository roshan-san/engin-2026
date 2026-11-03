import { DISCIPLINES, type Discipline } from "~/shared/config/disciplines";
import { pickChip } from "~/shared/lib/search";

export type PeopleSearch = { discipline?: Discipline };

/** People filters from the URL, safe to send to the query. Unknown values become `undefined` and other params are left out. */
export function parsePeopleSearch(raw: Record<string, unknown>): PeopleSearch {
	return { discipline: pickChip(DISCIPLINES, raw.discipline) };
}
