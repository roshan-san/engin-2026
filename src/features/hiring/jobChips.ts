import type { jobRole } from "@convex/schema";
import type { Infer } from "convex/values";

type Chip<T extends string> = { readonly value: T; readonly label: string };
export type JobRole = Infer<typeof jobRole>;

export const ROLES: readonly Chip<JobRole>[] = [
	{ value: "frontend", label: "Frontend" },
	{ value: "backend", label: "Backend" },
	{ value: "fullstack", label: "Full-stack" },
	{ value: "designer", label: "Designer" },
	{ value: "marketing", label: "Marketing" },
	{ value: "sales", label: "Sales" },
	{ value: "ops", label: "Ops" },
	{ value: "other", label: "Other" },
];

export function roleLabel(role: JobRole): string {
	return ROLES.find((chip) => chip.value === role)?.label ?? "Other";
}
