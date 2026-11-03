import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { POST_INTENT_PATH, START_INTENT_PATH } from "~/entities/place";
import { GoogleButton } from "~/features/sign-in";
import { BoardMock } from "./BoardMock";
import { BuildersMock, DoneCardMock, WeekMock } from "./LandingMocks";
import { LandingPanel } from "./LandingPanel";
import { OpenNow } from "./OpenNow";

type Point = { readonly title: string; readonly body: string };

const SHIP_AND_TALK = [
	{
		title: "What you ship.",
		body: "A week of work, planned together on Monday and shown on Friday.",
	},
	{
		title: "Who you talk to.",
		body: "Customers, investors, pitches and presentations.",
	},
] as const;

const WEEK = [
	{
		title: "Monday: meet and plan.",
		body: "One call. Everyone puts this week's work on the board.",
	},
	{
		title: "All week: ship it.",
		body: "Each person works their own row. Talk in threads, not meetings.",
	},
	{
		title: "Friday: meet and close.",
		body: "Approve what got done. Whatever's left ends with the week.",
	},
] as const;

const BELIEFS = [
	{
		title: "Fix the time, cut the scope.",
		body: "When the work doesn't fit in the week, do less of it.",
	},
	{
		title: "No backlog.",
		body: "Unfinished work ends with the week. If it still matters, plan it again on Monday.",
	},
	{
		title: "Done means shipped.",
		body: "Work counts as done once it has a link or a picture.",
	},
] as const;

const HACKATHON_STEPS = [
	{
		title: "Post your real problem.",
		body: "One or two weeks, with a handful of builders.",
	},
	{
		title: "They build, you watch.",
		body: "Each works through the same tasks, and you see what got done.",
	},
	{
		title: "Talk, then decide.",
		body: "Talk through the work with your shortlist. Everyone hears back.",
	},
] as const;

function Heading({ children }: { readonly children: ReactNode }) {
	return (
		<h2 className="text-3xl font-semibold text-balance md:text-5xl">
			{children}
		</h2>
	);
}

function Lead({ children }: { readonly children: ReactNode }) {
	return (
		<p className="text-lg text-pretty text-current/70 md:text-2xl">
			{children}
		</p>
	);
}

function PointText({ point }: { readonly point: Point }) {
	return (
		<>
			<p className="text-lg font-semibold md:text-2xl">{point.title}</p>
			<p className="mt-1 text-lg text-current/70">{point.body}</p>
		</>
	);
}

function Points({ points }: { readonly points: readonly Point[] }) {
	return (
		<ul className="flex flex-col gap-10">
			{points.map((point) => (
				<li key={point.title}>
					<PointText point={point} />
				</li>
			))}
		</ul>
	);
}

function NumberedPoints({ points }: { readonly points: readonly Point[] }) {
	return (
		<ol className="flex flex-col gap-10">
			{points.map((point, index) => (
				<li key={point.title} className="flex gap-5">
					<span className="text-lg font-semibold tabular-nums text-current/50 md:text-2xl">
						{index + 1}
					</span>
					<div className="min-w-0">
						<PointText point={point} />
					</div>
				</li>
			))}
		</ol>
	);
}

function FindHackathonLink() {
	return (
		<Link
			to="/explore/hackathons"
			className="rounded-sm text-lg font-medium underline underline-offset-4 focus-ring"
		>
			Find a hackathon →
		</Link>
	);
}

export function HeroPanel() {
	return (
		<section className="mx-auto flex w-full max-w-6xl flex-col justify-center gap-12 px-4 py-20 md:min-h-dvh md:gap-16 md:px-6 md:py-32">
			<div className="flex flex-col items-start gap-8">
				<h1 className="text-5xl font-semibold text-balance md:text-7xl">
					The fast lane for founders
				</h1>
				<div className="flex flex-wrap items-center gap-x-6 gap-y-4">
					<GoogleButton
						label="Start building"
						variant="default"
						size="lg"
						returnTo={START_INTENT_PATH}
					/>
					<FindHackathonLink />
				</div>
			</div>
			<BoardMock />
		</section>
	);
}

export function SeenPanel() {
	return (
		<LandingPanel
			left={
				<>
					<Heading>Nobody can back a startup they can't see.</Heading>
					<Lead>
						Ship every week. Talk to people. Let your work be your pitch.
					</Lead>
				</>
			}
			right={<Points points={SHIP_AND_TALK} />}
		/>
	);
}

export function WeekPanel() {
	return (
		<LandingPanel
			left={
				<>
					<Heading>Two meetings a week.</Heading>
					<WeekMock />
				</>
			}
			right={<NumberedPoints points={WEEK} />}
		/>
	);
}

export function BeliefsPanel() {
	return (
		<LandingPanel
			left={
				<>
					<Heading>How we think.</Heading>
					<DoneCardMock />
				</>
			}
			right={<Points points={BELIEFS} />}
		/>
	);
}

export function MomentumPanel() {
	return (
		<LandingPanel
			left={
				<h2 className="font-mono text-5xl font-semibold md:text-7xl">p = mv</h2>
			}
			right={
				<Lead>
					Momentum is what you've built, times how fast you keep building. Stop
					shipping and it fades.
				</Lead>
			}
		/>
	);
}

export function HackathonsPanel() {
	return (
		<LandingPanel
			left={
				<>
					<Heading>Need someone? Watch them build first.</Heading>
					<p className="text-sm text-current/70">Hackathons are on Pro.</p>
					<GoogleButton
						label="Post a hackathon"
						variant="default"
						size="lg"
						returnTo={POST_INTENT_PATH}
					/>
					<BuildersMock />
				</>
			}
			right={<NumberedPoints points={HACKATHON_STEPS} />}
		/>
	);
}

export function ContributorsPanel() {
	return (
		<LandingPanel
			tone="contributor"
			left={
				<>
					<p className="text-sm font-medium">For contributors</p>
					<Heading>Work on a real startup problem.</Heading>
					<Lead>
						You hear back whatever the decision. Approved work raises your
						Momentum.
					</Lead>
					<FindHackathonLink />
				</>
			}
			right={<OpenNow />}
		/>
	);
}

export function FreePanel() {
	return (
		<section
			id="pricing"
			className="flex items-center border-t border-border md:min-h-[85dvh]"
		>
			<div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center md:px-6 md:py-32">
				<Heading>Free for teams of up to 10.</Heading>
				<Lead>No card. Start this week.</Lead>
				<GoogleButton
					label="Start building"
					variant="default"
					size="lg"
					returnTo={START_INTENT_PATH}
				/>
			</div>
		</section>
	);
}
