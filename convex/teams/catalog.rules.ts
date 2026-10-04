const STARTUP_CATEGORIES = [
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

type StartupCategory = (typeof STARTUP_CATEGORIES)[number];

/** Unknown categories are dropped rather than stored. */
export function parseCategory(
	value: string | undefined,
): StartupCategory | undefined {
	if (!value) {
		return undefined;
	}
	return STARTUP_CATEGORIES.find((category) => category === value);
}
