import type { startupCity, startupStage } from "@convex/startups/rules";
import type { Infer } from "convex/values";
import { pickChip } from "~/shared/lib/search";
import { CITIES, STAGES } from "../config/startupChips";

export type StartupSearch = {
	stage?: Infer<typeof startupStage>;
	city?: Infer<typeof startupCity>;
};

/** Startup filters from the URL, safe to send to the query. Unknown values become `undefined` and other params are left out. */
export function parseStartupSearch(
	raw: Record<string, unknown>,
): StartupSearch {
	const stage = pickChip(STAGES, raw.stage);
	const city = pickChip(CITIES, raw.city);

	return { stage, city };
}
