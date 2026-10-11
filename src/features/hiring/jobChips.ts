import type { jobMode, jobPay, jobRole } from "@convex/schema";
import type { Infer } from "convex/values";

type Chip<T extends string> = { readonly value: T; readonly label: string };
export type JobRole = Infer<typeof jobRole>;
export type JobPay = Infer<typeof jobPay>;
export type JobMode = Infer<typeof jobMode>;
export type Job = { role: JobRole; pay: JobPay; mode: JobMode };

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

export const PAYS: readonly Chip<JobPay>[] = [
	{ value: "3_6l", label: "₹3–6 L" },
	{ value: "6_9l", label: "₹6–9 L" },
	{ value: "9_15l", label: "₹9–15 L" },
	{ value: "equity", label: "Equity" },
	{ value: "unpaid", label: "Unpaid" },
];

export const MODES: readonly Chip<JobMode>[] = [
	{ value: "remote", label: "Remote" },
	{ value: "onsite", label: "On-site" },
	{ value: "hybrid", label: "Hybrid" },
];

function labelOf<T extends string>(chips: readonly Chip<T>[], value: T) {
	return chips.find((chip) => chip.value === value)?.label ?? value;
}

export function roleLabel(role: JobRole): string {
	return labelOf(ROLES, role);
}

/** "Frontend · ₹6–9 L · Remote" */
export function jobLine(job: Job): string {
	return [
		labelOf(ROLES, job.role),
		labelOf(PAYS, job.pay),
		labelOf(MODES, job.mode),
	].join(" · ");
}
