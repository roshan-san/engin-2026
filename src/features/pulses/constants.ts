export const PULSE_STATUSES = [
	{ value: "backlog", label: "Backlog" },
	{ value: "active", label: "Active" },
	{ value: "blocked", label: "Blocked" },
	{ value: "done", label: "Done" },
] as const;

export type PulseStatus = (typeof PULSE_STATUSES)[number]["value"];
