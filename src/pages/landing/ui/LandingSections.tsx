import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { POST_INTENT_PATH, START_INTENT_PATH } from "~/entities/place";
import { GoogleButton } from "~/features/sign-in";
import { BoardMock } from "./BoardMock";
import { LandingPanel } from "./LandingPanel";
import { OpenNow } from "./OpenNow";

type Point = { readonly title: string; readonly body: string };

const SHIP_AND_TALK = [
	{
		title: "What you ship.",
		body: "One goal a week and the work to reach it.",
	},
	{
		title: "Who you talk to.",
		body: "Customers, investors, pitches and presentations.",
	},
] as const;

const WEEK = [
	{
		title: "Monday: pick one goal.",
		body: "What should change for users by Sunday?",
	},
	{
		title: "All week: ship it.",
		body: "Three to five pieces of work, moved across one board.",
	},
	{
		title: "Next Monday: look back.",
		body: "Did the goal happen? Carry or drop what's left, then pick the next one.",
	},
] as const;

const BELIEFS = [
	{
		title: "Fix the time, cut the scope.",
		body: "When the work doesn't fit in the week, do less of it.",
	},
	{
		title: "No backlog.",
		body: "Each Monday, carry what still matters and drop the rest.",
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
		<h2 className="text-4xl font-semibold text-balance md:text-6xl">
			{children}
		</h2>
	);
}

function Lead({ children }: { readonly children: ReactNode }) {
	return <p className="text-xl text-pretty text-current/80">{children}</p>;
}

function PointText({ point }: { readonly point: Point }) {
	return (
		<>
			<p className="text-xl font-semibold">{point.title}</p>
			<p className="mt-1 text-lg text-current/80">{point.body}</p>
		</>
	);
}

function Points({ points }: { readonly points: readonly Point[] }) {
	return (
		<ul className="flex flex-col gap-8">
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
		<ol className="flex flex-col gap-8">
			{points.map((point, index) => (
				<li key={point.title} className="flex gap-5">
					<span className="text-xl font-semibold tabular-nums text-current/60">
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

export function HeroPanel() {
	return (
		<LandingPanel
			left={
				<>
					<h1 className="text-6xl font-semibold text-balance md:text-8xl">
						The fast lane for founders
					</h1>
					<GoogleButton
						label="Start building"
						variant="default"
						size="lg"
						returnTo={START_INTENT_PATH}
					/>
				</>
			}
			right={<BoardMock />}
		/>
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
			left={<Heading>One goal a week.</Heading>}
			right={<NumberedPoints points={WEEK} />}
		/>
	);
}

export function BeliefsPanel() {
	return (
		<LandingPanel
			left={<Heading>How we think.</Heading>}
			right={<Points points={BELIEFS} />}
		/>
	);
}

export function MomentumPanel() {
	return (
		<LandingPanel
			left={
				<h2 className="font-mono text-6xl font-semibold md:text-8xl">p = mv</h2>
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
					<p className="text-sm text-current/80">Hackathons are on Pro.</p>
					<GoogleButton
						label="Post a hackathon"
						variant="default"
						size="lg"
						returnTo={POST_INTENT_PATH}
					/>
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
					<Link
						to="/explore/hackathons"
						className="rounded-sm text-lg font-medium underline underline-offset-4 focus-ring"
					>
						Find a hackathon →
					</Link>
				</>
			}
			right={<OpenNow />}
		/>
	);
}

export function FreePanel() {
	return (
		<LandingPanel
			left={
				<>
					<Heading>Free for teams of up to 10.</Heading>
					<Lead>No card. Start this week.</Lead>
				</>
			}
			right={
				<GoogleButton
					label="Start building"
					variant="default"
					size="lg"
					returnTo={START_INTENT_PATH}
				/>
			}
		/>
	);
}
