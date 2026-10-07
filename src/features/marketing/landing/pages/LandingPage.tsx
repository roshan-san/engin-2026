import { useConvexAuth } from "@convex-dev/auth/react";
import { Link, Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { GlowHero } from "~/components/shared/GlowHero";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import { CyclesMock } from "~/features/marketing/landing/components/CyclesMock";
import { HackathonMock } from "~/features/marketing/landing/components/HackathonMock";
import { ProofMock } from "~/features/marketing/landing/components/ProofMock";
import { GoogleButton } from "~/features/people/auth/components/GoogleButton";
import { PublicShell } from "~/shell/layout/PublicShell";

export function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (isAuthenticated) {
		return <Navigate to="/my-tasks" />;
	}

	return (
		<PublicShell>
			<div className="mx-auto w-full max-w-5xl space-y-16 md:space-y-24">
				<GlowHero
					eyebrow={
						<SectionLabel as="p">
							The hiring hackathon for early-stage startups
						</SectionLabel>
					}
					title="Hire through hackathons. Run work in Cycles."
					subtitle="Founders set real Starter Tasks, watch real work happen, and hire from it. Contributors build for free and earn a Score that follows them."
				>
					<div className="flex flex-wrap gap-3">
						<GoogleButton label="Get started" variant="default" size="lg" />
						<Button asChild variant="outline" size="lg">
							<Link to="/explore/startups">Explore startups</Link>
						</Button>
					</div>
				</GlowHero>

				<Feature
					label="Hackathons"
					title="Hire from real work, not interviews."
					body="Post a hackathon with a few Starter Tasks from your actual backlog. Every admitted applicant gets a private lane, and you judge what they ship."
					mock={<HackathonMock />}
				/>
				<Feature
					label="Cycles"
					title="Run your team's work in Cycles."
					body="Every Task moves from To do to Done. Review needs a proof link, and only a Founder verifies it, so Done always means done."
					mock={<CyclesMock />}
					flip
				/>
				<Feature
					label="Proof of work & Score"
					title="Work that counts, a Score that shows it."
					body="Verified proof of work and hackathon verdicts build a Score that follows you from startup to startup. Entering a hackathon is always free."
					mock={<ProofMock />}
				/>

				<footer className="flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
					<p>
						<span className="font-semibold text-foreground">Engin</span> · Hire
						by watching people build.
					</p>
					<nav className="flex gap-4">
						<Link to="/explore/startups" className="hover:text-foreground">
							Explore
						</Link>
						<Link to="/pricing" className="hover:text-foreground">
							Pricing
						</Link>
					</nav>
				</footer>
			</div>
		</PublicShell>
	);
}

type FeatureProps = {
	readonly label: string;
	readonly title: string;
	readonly body: string;
	readonly mock: ReactNode;
	readonly flip?: boolean;
};

function Feature({ label, title, body, mock, flip = false }: FeatureProps) {
	return (
		<section className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
			<div className={flip ? "md:order-2" : undefined}>
				<SectionLabel as="p">{label}</SectionLabel>
				<h2 className="mt-2 text-xl font-semibold tracking-[-0.01em] md:text-2xl">
					{title}
				</h2>
				<p className="mt-3 text-muted-foreground">{body}</p>
			</div>
			<div aria-hidden className="min-w-0 select-none">
				{mock}
			</div>
		</section>
	);
}
