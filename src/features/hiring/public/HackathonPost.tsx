import { MAX_BUILDERS } from "@convex/lib/limits";
import type { ReactNode } from "react";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { cn } from "~/lib/utils";
import {
	buildDaysLabel,
	dayLabel,
	hackathonDates,
	lastDay,
} from "../hackathonDates";
import {
	type JobMode,
	type JobPay,
	type JobRole,
	MODES,
	PAYS,
	ROLES,
} from "../jobChips";

export type PostView = {
	readonly startupName: string;
	readonly job: {
		readonly role: JobRole | null;
		readonly pay: JobPay | null;
		readonly mode: JobMode | null;
	};
	readonly problem: string;
	/** The Card titles each Builder gets. */
	readonly cards: readonly string[];
	readonly weeks: 1 | 2;
	readonly startsAt: number | null;
	readonly buildersGet: string | null;
};

function labelOf<T extends string>(
	chips: readonly { value: T; label: string }[],
	value: T | null,
) {
	return value
		? (chips.find((chip) => chip.value === value)?.label ?? null)
		: null;
}

/** A missing part, while the post is still being written. */
function Unwritten({ children }: { readonly children: ReactNode }) {
	return <span className="text-subtle-foreground">{children}</span>;
}

/**
 * A Hackathon as Applicants read it: the job and what Builders get, the problem, the Cards, and how
 * the weeks run. The public page shows it, and so does the form's preview.
 */
export function HackathonPost({
	post,
	size = "page",
}: {
	readonly post: PostView;
	/** `preview` is the form's smaller copy beside the fields. */
	readonly size?: "page" | "preview";
}) {
	const role = labelOf(ROLES, post.job.role);
	const facts = [
		labelOf(PAYS, post.job.pay),
		labelOf(MODES, post.job.mode),
		post.weeks === 1 ? "1 week" : "2 weeks",
	].filter((fact) => fact !== null);
	const problem = post.problem.trim();
	const isPage = size === "page";

	return (
		<article
			className={cn("flex min-w-0 flex-col", isPage ? "gap-10" : "gap-7")}
		>
			<header className="flex flex-col gap-3">
				<p className="text-sm text-muted-foreground">
					{post.startupName} is hiring
				</p>
				<h1
					className={cn(
						"font-semibold tracking-tight",
						isPage ? "text-3xl" : "text-xl",
					)}
				>
					{role ?? <Unwritten>The role</Unwritten>}
				</h1>
				<ul className="flex flex-wrap gap-1.5">
					{facts.map((fact) => (
						<li
							key={fact}
							className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
						>
							{fact}
						</li>
					))}
					{post.buildersGet ? (
						<li className="rounded-full border border-success/40 px-2.5 py-0.5 text-xs text-success">
							Builders get {post.buildersGet}
						</li>
					) : null}
				</ul>
			</header>

			<section className="flex flex-col gap-3">
				<SectionLabel>The problem</SectionLabel>
				<p
					className={cn(
						"leading-relaxed break-words whitespace-pre-wrap",
						isPage ? "text-base" : "text-sm",
					)}
				>
					{problem || <Unwritten>A real first-month problem.</Unwritten>}
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<SectionLabel>What you'll build</SectionLabel>
				<ol className="flex flex-col gap-1.5">
					{post.cards.length === 0 ? (
						<li className="rounded-md border border-dashed border-border px-3 py-2.5 text-sm">
							<Unwritten>The Cards each Builder starts with.</Unwritten>
						</li>
					) : null}
					{post.cards.map((title, index) => (
						<li
							// Titles can repeat while they're typed; the order is stable.
							// biome-ignore lint/suspicious/noArrayIndexKey: see above
							key={index}
							className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-sm"
						>
							<span className="w-4 shrink-0 text-xs leading-5 text-subtle-foreground tabular-nums">
								{index + 1}
							</span>
							<span className="min-w-0 break-words">
								{title.trim() || <Unwritten>Card title</Unwritten>}
							</span>
						</li>
					))}
				</ol>
			</section>

			<section className="flex flex-col gap-3">
				<SectionLabel>How it works</SectionLabel>
				<Timeline startsAt={post.startsAt} weeks={post.weeks} />
			</section>
		</article>
	);
}

/** Apply, build, walk through, decide: with the dates once the start is picked. */
function Timeline({
	startsAt,
	weeks,
}: {
	readonly startsAt: number | null;
	readonly weeks: 1 | 2;
}) {
	const dates = startsAt === null ? null : hackathonDates(startsAt, weeks);
	const steps = [
		{
			title: "Apply",
			when: startsAt === null ? null : `until ${dayLabel(lastDay(startsAt))}`,
			body: `Say how you'd approach it. Up to ${MAX_BUILDERS} become Builders.`,
		},
		{
			title: "Build",
			when:
				startsAt === null || !dates
					? null
					: buildDaysLabel(startsAt, dates.endsAt),
			body: "Your own Board with these Cards. Ask questions in # Everyone.",
		},
		{
			title: "Walkthrough",
			when: null,
			body: "A call with the Founder about what you shipped.",
		},
		{
			title: "Decision",
			when: dates ? `by ${dayLabel(lastDay(dates.decideBy))}` : null,
			body: "Hired or Not this time. Hired joins the team.",
		},
	];

	return (
		<ol className="flex flex-col">
			{steps.map((step, index) => (
				<li key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
					{index < steps.length - 1 ? (
						<span
							aria-hidden
							className="absolute top-6 bottom-1 left-[11px] w-px bg-border"
						/>
					) : null}
					<span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground tabular-nums">
						{index + 1}
					</span>
					<div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
						<p className="text-sm">
							<span className="font-medium">{step.title}</span>
							{step.when ? (
								<span className="text-muted-foreground"> · {step.when}</span>
							) : null}
						</p>
						<p className="text-sm text-muted-foreground">{step.body}</p>
					</div>
				</li>
			))}
		</ol>
	);
}
