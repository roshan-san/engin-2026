import { MAX_TRIAL_PARTICIPANTS } from "@convex/lib/limits";
import { useConvexAuth } from "@convex-dev/auth/react";
import { Link, Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { Button } from "~/components/ui/button";
import { GoogleButton } from "~/features/people/auth/components/GoogleButton";

const FOUNDER_POINTS = [
	"Post a hackathon with a few scoped challenges from your real work.",
	`Admit the applicants you want, up to ${MAX_TRIAL_PARTICIPANTS} per hackathon.`,
	"Judge what they build, give each one a verdict, and make offers.",
];

const CONTRIBUTOR_POINTS = [
	"Entering is always free.",
	"You own what you build.",
	"Your verdicts show on your profile, naming the startup that gave them.",
];

const STEPS = [
	{ title: "Apply", body: "Pick an open hackathon and apply." },
	{ title: "Join", body: "The founders admit you before it starts." },
	{ title: "Build", body: "Work the challenges on your own private board." },
	{ title: "Verdict", body: "The founders judge your work when it closes." },
];

export function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (isAuthenticated) {
		return <Navigate to="/my-pulses" />;
	}

	return (
		<div className="flex min-h-dvh flex-col bg-background p-4 text-foreground">
			<header className="flex items-center justify-between gap-4 px-2">
				<Link to="/" className="text-2xl font-semibold">
					Engin
				</Link>
				<nav className="flex items-center gap-4 text-sm text-muted-foreground">
					<Link to="/discover" className="hover:text-foreground">
						Discover
					</Link>
					<Link to="/pricing" className="hover:text-foreground">
						Pricing
					</Link>
				</nav>
			</header>

			<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-2 py-16">
				<section className="space-y-6">
					<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
						Hire by watching people build.
					</h1>
					<p className="max-w-2xl text-lg text-muted-foreground">
						Engin is the online hiring hackathon for early-stage startups.
						Founders set real challenges, see real work, and hire from it.
					</p>
					<div className="flex flex-wrap gap-3">
						<GoogleButton />
						<Button asChild variant="ghost">
							<Link to="/discover">Browse hackathons</Link>
						</Button>
					</div>
				</section>

				<section className="grid gap-10 sm:grid-cols-2">
					<PointList title="For founders" points={FOUNDER_POINTS}>
						<Link
							to="/pricing"
							className="text-sm underline underline-offset-4"
						>
							See pricing
						</Link>
					</PointList>
					<PointList title="For contributors" points={CONTRIBUTOR_POINTS}>
						<Link
							to="/discover"
							className="text-sm underline underline-offset-4"
						>
							Find a hackathon
						</Link>
					</PointList>
				</section>

				<section className="space-y-6">
					<h2 className="text-xl font-semibold">How a hackathon runs</h2>
					<ol className="grid gap-6 sm:grid-cols-4">
						{STEPS.map((step, index) => (
							<li key={step.title} className="space-y-1">
								<p className="text-sm text-muted-foreground">{index + 1}</p>
								<p className="font-medium">{step.title}</p>
								<p className="text-sm text-muted-foreground">{step.body}</p>
							</li>
						))}
					</ol>
				</section>
			</main>
		</div>
	);
}

type PointListProps = {
	readonly title: string;
	readonly points: readonly string[];
	readonly children: ReactNode;
};

function PointList({ title, points, children }: PointListProps) {
	return (
		<div className="space-y-4">
			<h2 className="text-xl font-semibold">{title}</h2>
			<ul className="space-y-2 text-muted-foreground">
				{points.map((point) => (
					<li key={point}>{point}</li>
				))}
			</ul>
			{children}
		</div>
	);
}
