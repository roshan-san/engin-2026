import { useConvexAuth } from "@convex-dev/auth/react";
import { Link, Navigate } from "@tanstack/react-router";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { TILE } from "~/components/tile";
import { BoardMock } from "~/features/marketing/BoardMock";
import { OpenNow } from "~/features/marketing/OpenNow";
import { Pricing } from "~/features/marketing/Pricing";
import { GoogleButton } from "~/features/people/auth/GoogleButton";
import { cn } from "~/lib/utils";
import { pickLanding, readLastPlace } from "~/shell/landing";
import { PublicShell } from "~/shell/PublicShell";
import { usePlaces } from "~/shell/usePlaces";

const STEPS = [
	{
		title: "Post your real problem",
		body: "One or two weeks, a handful of Participants, and the stipend shown upfront.",
	},
	{
		title: "Participants ship on their own Boards",
		body: "Each works through the same Cards. You see what shipped, Card by Card.",
	},
	{
		title: "Walkthrough, then a Decision",
		body: "Talk through the work with your shortlist. Every Participant hears back.",
	},
] as const;

const AUDIENCES = [
	{
		title: "For Founders",
		lines: [
			"Stop guessing from CVs: watch real work on your real problem.",
			"Hire in one click; the Participant joins your team.",
			"Then run your team's week in Cycles on the same Board.",
		],
	},
	{
		title: "For Participants",
		lines: [
			"Work on a real startup problem, not a puzzle.",
			"The stipend is shown upfront, and you always get a Decision.",
			"Verified work builds a Rating that follows you.",
		],
	},
] as const;

/** Sends a signed-in visitor to the place they were last in, else their first. */
function LandingRedirect() {
	const places = usePlaces();

	if (!places) {
		return <GlobalSpinner />;
	}

	return <Navigate to={pickLanding(places, readLastPlace())} replace />;
}

export function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (isAuthenticated) {
		return <LandingRedirect />;
	}

	return (
		<PublicShell>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4 py-12 md:gap-28 md:px-6 md:py-20">
				<section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
					<div className="flex flex-col gap-5">
						<p className="text-sm font-medium text-muted-foreground">
							Hiring Hackathons for early-stage startups
						</p>
						<h1 className="text-3xl font-semibold text-balance md:text-5xl">
							Watch them ship before you hire.
						</h1>
						<p className="text-lg text-muted-foreground text-pretty">
							Run a small, private Hackathon on your real problem. A handful of
							Participants work on their own Boards. You check what ships, then
							decide. Stipend shown upfront.
						</p>
						<div className="flex flex-wrap items-center gap-3">
							<GoogleButton
								label="Post a hackathon"
								variant="default"
								size="lg"
								returnTo="/home?intent=post"
							/>
							<Link
								to="/explore/hackathons"
								className="rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-ring"
							>
								Find a hackathon →
							</Link>
						</div>
					</div>
					<BoardMock />
				</section>

				<section className="flex flex-col gap-6">
					<h2 className="text-2xl font-semibold">How it works</h2>
					<ol className="grid gap-3 md:grid-cols-3">
						{STEPS.map((step, index) => (
							<li key={step.title} className={cn(TILE, "flex flex-col gap-2")}>
								<span className="text-sm font-semibold tabular-nums text-muted-foreground">
									{index + 1}
								</span>
								<p className="font-medium">{step.title}</p>
								<p className="text-sm text-muted-foreground">{step.body}</p>
							</li>
						))}
					</ol>
				</section>

				<section className="grid gap-3 md:grid-cols-2">
					{AUDIENCES.map((audience) => (
						<div
							key={audience.title}
							className={cn(TILE, "flex flex-col gap-3 p-6")}
						>
							<h2 className="text-lg font-semibold">{audience.title}</h2>
							<ul className="flex flex-col gap-2 text-sm text-muted-foreground">
								{audience.lines.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</div>
					))}
				</section>

				<OpenNow />
				<Pricing />

				<section
					className={cn(
						TILE,
						"flex flex-col items-center gap-4 px-6 py-12 text-center",
					)}
				>
					<h2 className="text-2xl font-semibold text-balance">
						See if they can actually do the work.
					</h2>
					<GoogleButton
						label="Post a hackathon"
						variant="default"
						size="lg"
						returnTo="/home?intent=post"
					/>
				</section>
			</div>
		</PublicShell>
	);
}
