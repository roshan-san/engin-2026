import { v } from "convex/values";

export const STARTUP_CATEGORIES = [
	"ai",
	"developer-tools",
	"fintech",
	"health",
	"climate",
	"consumer",
	"marketplace",
	"saas",
	"other",
] as const;

export const STARTUP_STAGES = [
	"idea",
	"pre-seed",
	"seed",
	"series-a",
	"growth",
] as const;

export const startupCategory = v.union(
	v.literal("ai"),
	v.literal("developer-tools"),
	v.literal("fintech"),
	v.literal("health"),
	v.literal("climate"),
	v.literal("consumer"),
	v.literal("marketplace"),
	v.literal("saas"),
	v.literal("other"),
);

export const startupStage = v.union(
	v.literal("idea"),
	v.literal("pre-seed"),
	v.literal("seed"),
	v.literal("series-a"),
	v.literal("growth"),
);

export type StartupCategory = (typeof STARTUP_CATEGORIES)[number];
export type StartupStage = (typeof STARTUP_STAGES)[number];

export function parseCategory(
	value: string | undefined,
): StartupCategory | undefined {
	if (!value) {
		return undefined;
	}
	return STARTUP_CATEGORIES.find((category) => category === value);
}
