export type DesignSystem = "geist" | "linear" | "zinc";

/** The candidate systems on `/design`, in picker order. */
export const DESIGN_SYSTEMS: readonly {
	readonly id: DesignSystem;
	readonly label: string;
	readonly blurb: string;
}[] = [
	{
		id: "geist",
		label: "Geist",
		blurb: "Pure black, white primary, blue only for links and focus.",
	},
	{
		id: "linear",
		label: "Linear",
		blurb: "Cool near-black, indigo primary, dense 13px Inter.",
	},
	{
		id: "zinc",
		label: "Zinc",
		blurb: "Warm charcoal, raised cards, rounder and roomier.",
	},
];

/** Any unknown value (bad `?system=`, missing, wrong type) falls back to Geist. */
export function parseDesignSystem(value: unknown): DesignSystem {
	return DESIGN_SYSTEMS.find((system) => system.id === value)?.id ?? "geist";
}
