export const STARTUP_CATEGORIES = [
	{ value: "ai", label: "AI" },
	{ value: "developer-tools", label: "Developer tools" },
	{ value: "fintech", label: "Fintech" },
	{ value: "health", label: "Health" },
	{ value: "climate", label: "Climate" },
	{ value: "consumer", label: "Consumer" },
	{ value: "marketplace", label: "Marketplace" },
	{ value: "saas", label: "SaaS" },
	{ value: "other", label: "Other" },
] as const;

export const STARTUP_STAGES = [
	{ value: "idea", label: "Idea" },
	{ value: "pre-seed", label: "Pre-seed" },
	{ value: "seed", label: "Seed" },
	{ value: "series-a", label: "Series A" },
	{ value: "growth", label: "Growth" },
] as const;

export type StartupCategory = (typeof STARTUP_CATEGORIES)[number]["value"];
export type StartupStage = (typeof STARTUP_STAGES)[number]["value"];

export function categoryLabel(value: string | null | undefined): string | null {
	return STARTUP_CATEGORIES.find((item) => item.value === value)?.label ?? null;
}

export function stageLabel(value: string | null | undefined): string | null {
	return STARTUP_STAGES.find((item) => item.value === value)?.label ?? null;
}
