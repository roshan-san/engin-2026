import type { ShellContext } from "~/shell/context";

export type SampleTask = {
	readonly number: number;
	readonly title: string;
	readonly assignee: string;
	readonly status: "todo" | "in_progress" | "review" | "done";
	readonly due: string;
};

export const SAMPLE_TASKS: readonly SampleTask[] = [
	{
		number: 128,
		title: "Ship onboarding Skip all",
		assignee: "Roshan R",
		status: "done",
		due: "Oct 6",
	},
	{
		number: 131,
		title: "Team filters on Hiring",
		assignee: "Maya Chen",
		status: "review",
		due: "Oct 9",
	},
	{
		number: 134,
		title: "Stripe-free checkout fallback",
		assignee: "Leo Park",
		status: "in_progress",
		due: "Oct 11",
	},
	{
		number: 137,
		title: "Score evidence on profile",
		assignee: "Ana Ruiz",
		status: "in_progress",
		due: "Oct 12",
	},
	{
		number: 140,
		title: "Weekly founder digest email",
		assignee: "Sam Okafor",
		status: "todo",
		due: "Oct 15",
	},
];

export const STATUS_LABEL: Record<SampleTask["status"], string> = {
	todo: "To do",
	in_progress: "In progress",
	review: "In review",
	done: "Done",
};

export const STATUS_TONE = {
	todo: "neutral",
	in_progress: "warning",
	review: "link",
	done: "success",
} as const;

/** A Startup context for the chrome preview; tabs point at real routes. */
export const SAMPLE_CONTEXT: ShellContext = {
	kind: "startup",
	slug: "acme",
	tabs: [
		{ label: "Cycles", href: "/s/acme/cycles" },
		{ label: "Hiring", href: "/s/acme/hiring" },
		{ label: "Team", href: "/s/acme/team" },
		{ label: "Pitch", href: "/s/acme/pitch" },
		{ label: "Activity", href: "/s/acme/activity" },
		{ label: "Settings", href: "/s/acme/settings", overflow: true },
	],
	activeTab: { label: "Cycles", href: "/s/acme/cycles" },
};

/** Colour tokens shown as swatches, in reading order. */
export const SWATCH_TOKENS = [
	"background",
	"card",
	"accent",
	"border",
	"input",
	"foreground",
	"muted-foreground",
	"subtle-foreground",
	"primary",
	"link",
	"success",
	"warning",
	"destructive",
] as const;
