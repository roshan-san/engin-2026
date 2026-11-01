import type { startupCity, startupStage } from "@convex/startups/rules";
import type { Infer } from "convex/values";
import { pickChip } from "~/shared/lib/search";
import { CITIES, STAGES } from "../config/startupChips";

export type StartupSearch = {
	stage?: Infer<typeof startupStage>;
	city?: Infer<typeof startupCity>;
};

/** Startup filters from the URL. Unknown values become `undefined`. */
export function parseStartupSearch(
	raw: Record<string, unknown>,
): StartupSearch {
	const stage = pickChip(STAGES, raw.stage);
	const city = pickChip(CITIES, raw.city);

	return { stage, city };
}

/** The query's arguments. The router's search also carries whatever else is in the URL, and the server refuses extras. */
export function startupExploreArgs(search: StartupSearch): StartupSearch {
	return { stage: search.stage, city: search.city };
}
