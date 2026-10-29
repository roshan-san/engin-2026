import type {
	startupCategory,
	startupCity,
	startupStage,
} from "@convex/shared/validators";
import type { Infer } from "convex/values";
import { pickChip } from "~/shared/lib/search";
import { CITIES, KINDS, STAGES } from "../config/startupChips";

export type StartupSearch = {
	stage?: Infer<typeof startupStage>;
	category?: Infer<typeof startupCategory>;
	city?: Infer<typeof startupCity>;
};

/** Startup filters from the URL. Unknown values become `undefined`. */
export function parseStartupSearch(
	raw: Record<string, unknown>,
): StartupSearch {
	const stage = pickChip(STAGES, raw.stage);
	const category = pickChip(KINDS, raw.category);
	const city = pickChip(CITIES, raw.city);

	return { stage, category, city };
}
