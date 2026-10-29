import { hackathonDates } from "@convex/shared/hackathonPhase";
import { MAX_PARTICIPANTS } from "@convex/shared/limits";
import type { ReactNode } from "react";
import { Section } from "~/components/Section";
import { Badge } from "~/components/ui/badge";
import { SignInCard } from "~/features/people";
import {
	type JobMode,
	type JobPay,
	type JobRole,
	MODES,
	PAYS,
	ROLES,
} from "~/shared/config/jobs";
import { cn } from "~/shared/lib/cn";
import { dayLabel } from "~/shared/lib/dates";
import { buildDaysLabel, lastDay } from "~/shared/lib/hackathonDates";

export type PostView = {
	readonly startupName: string;
	readonly job: {
		readonly role: JobRole | null;
		readonly pay: JobPay | null;
		readonly mode: JobMode | null;
	};
	readonly problem: string;
	/** The Card titles each Participant gets; `null` for a signed-out visitor, who sees the brief faded behind Sign in. */
	readonly cards: readonly string[] | null;
	readonly weeks: 1 | 2;
	readonly startsAt: number | null;
	readonly participantsGet: string | null;
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
 * A Hackathon as Applicants read it: the job and what Participants get, the problem, the Cards, and how
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
		post.startsAt === null
			? post.weeks === 1
				? "1 week"
				: "2 weeks"
			: buildDaysLabel(
					post.startsAt,
					hackathonDates(post.startsAt, post.weeks).endsAt,
				),
	].filter((fact) => fact !== null);
	const problem = post.problem.trim();
	const isPage = size === "page";
	const Title = isPage ? "h1" : "h2";

	return (
		<article
			className={cn("flex min-w-0 flex-col", isPage ? "gap-10" : "gap-6")}
		>
			<header className="flex flex-col gap-3">
				<p className="text-sm text-muted-foreground">
					{post.startupName} is hiring
				</p>
				{/* A preview sits under its page's own h1. */}
				<Title
					className={cn("font-semibold", isPage ? "text-3xl" : "text-2xl")}
				>
					{role ?? <Unwritten>The role</Unwritten>}
				</Title>
				<ul className="flex flex-wrap gap-2">
					{facts.map((fact) => (
						<li key={fact}>
							<Badge variant="secondary">{fact}</Badge>
						</li>
					))}
					{post.participantsGet ? (
						<li>
							<Badge variant="status" tone="success">
								Participants get {post.participantsGet}
							</Badge>
						</li>
					) : null}
				</ul>
			</header>

			<Section label="The problem">
				<p className="leading-relaxed break-words whitespace-pre-wrap">
					{problem || <Unwritten>A real first-month problem.</Unwritten>}
				</p>
			</Section>

			{post.cards === null ? (
				<GatedBrief post={post} />
			) : (
				<Brief cards={post.cards} startsAt={post.startsAt} weeks={post.weeks} />
			)}
		</article>
	);
}

/** What you'll build and how it works. */
function Brief({
	cards,
	startsAt,
	weeks,
}: {
	readonly cards: readonly string[];
	readonly startsAt: number | null;
	readonly weeks: 1 | 2;
}) {
	return (
		<>
			<Section label="What you'll build">
				<ol className="flex flex-col gap-1.5">
					{cards.length === 0 ? (
						<li className="rounded-md border border-dashed border-border px-3 py-2.5 text-sm">
							<Unwritten>The Cards each Participant starts with.</Unwritten>
						</li>
					) : null}
					{cards.map((title, index) => (
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
			</Section>

			<Section label="How it works">
				<Timeline startsAt={startsAt} weeks={weeks} />
			</Section>
		</>
	);
}

/** Signed out: the brief faded out behind Sign in. The Card titles never reach the page; blank rows stand in for them. */
function GatedBrief({ post }: { readonly post: PostView }) {
	return (
		<div className="relative">
			<div
				aria-hidden
				inert
				className="pointer-events-none flex select-none flex-col gap-10 opacity-40 [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
			>
				<Section label="What you'll build">
					<ol className="flex flex-col gap-1.5">
						{[1, 2, 3].map((n) => (
							<li
								key={n}
								className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5"
							>
								<span className="w-4 shrink-0 text-xs text-subtle-foreground tabular-nums">
									{n}
								</span>
								<span className="h-3 w-2/3 rounded bg-muted" />
							</li>
						))}
					</ol>
				</Section>
				<Section label="How it works">
					<Timeline startsAt={post.startsAt} weeks={post.weeks} />
				</Section>
			</div>
			<div className="absolute inset-x-0 top-10 flex justify-center px-4">
				<SignInCard>Sign in to see the full brief and apply.</SignInCard>
			</div>
		</div>
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
			body: `Say how you'd approach it. Up to ${MAX_PARTICIPANTS} become Participants.`,
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
