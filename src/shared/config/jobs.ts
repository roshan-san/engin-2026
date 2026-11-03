import type { jobMode, jobPay } from "@convex/hackathons/rules";
import type { Infer } from "convex/values";
import type { Discipline } from "./disciplines";

type Chip<T extends string> = { readonly value: T; readonly label: string };
export type JobPay = Infer<typeof jobPay>;
export type JobMode = Infer<typeof jobMode>;
export type Job = {
	title: string;
	discipline: Discipline;
	pay: JobPay;
	mode: JobMode;
};

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

/** "₹6–9 L · Remote": the job's terms, without the title. */
export function termsLine(job: Job): string {
	return `${labelOf(PAYS, job.pay)} · ${labelOf(MODES, job.mode)}`;
}

/** "Growth lead · ₹6–9 L · Remote" */
export function jobLine(job: Job): string {
	return [job.title, labelOf(PAYS, job.pay), labelOf(MODES, job.mode)].join(
		" · ",
	);
}
