import type {
	startupCategory,
	startupCity,
	startupStage,
} from "@convex/startups/rules";
import type { Infer } from "convex/values";

type Chip<T extends string> = { readonly value: T; readonly label: string };

export const STAGES: readonly Chip<Infer<typeof startupStage>>[] = [
	{ value: "idea", label: "Idea" },
	{ value: "building", label: "Building" },
	{ value: "launched", label: "Launched" },
	{ value: "earning", label: "Earning" },
];

export const KINDS: readonly Chip<Infer<typeof startupCategory>>[] = [
	{ value: "saas", label: "SaaS" },
	{ value: "consumer", label: "Consumer" },
	{ value: "fintech", label: "Fintech" },
	{ value: "d2c", label: "D2C" },
	{ value: "ai", label: "AI" },
	{ value: "marketplace", label: "Marketplace" },
	{ value: "other", label: "Other" },
];

export const CITIES: readonly Chip<Infer<typeof startupCity>>[] = [
	{ value: "bengaluru", label: "Bengaluru" },
	{ value: "delhi_ncr", label: "Delhi NCR" },
	{ value: "mumbai", label: "Mumbai" },
	{ value: "hyderabad", label: "Hyderabad" },
	{ value: "pune", label: "Pune" },
	{ value: "chennai", label: "Chennai" },
	{ value: "remote", label: "Remote" },
	{ value: "other", label: "Other" },
];

function labelOf(
	chips: readonly { readonly value: string; readonly label: string }[],
	value: string,
): string {
	return chips.find((chip) => chip.value === value)?.label ?? value;
}

/** A Startup's stage, kind and city in words, leaving out what it hasn't set. */
export function startupChipLabels(startup: {
	readonly stage?: string;
	readonly category?: string;
	readonly city?: string;
}): string[] {
	return [
		startup.stage && labelOf(STAGES, startup.stage),
		startup.category && labelOf(KINDS, startup.category),
		startup.city && labelOf(CITIES, startup.city),
	].filter((label) => label !== undefined && label !== "") as string[];
}
