import type { discipline } from "@convex/lib/disciplines";
import type { Infer } from "convex/values";

export type Discipline = Infer<typeof discipline>;

/** Every discipline as a chip, in the order shown. */
export const DISCIPLINES: readonly {
	readonly value: Discipline;
	readonly label: string;
}[] = [
	{ value: "developer", label: "Developer" },
	{ value: "designer", label: "Designer" },
	{ value: "marketing", label: "Marketing" },
	{ value: "sales", label: "Sales" },
	{ value: "other", label: "Other" },
];

export function disciplineLabel(d: Discipline): string {
	return DISCIPLINES.find((chip) => chip.value === d)?.label ?? d;
}
