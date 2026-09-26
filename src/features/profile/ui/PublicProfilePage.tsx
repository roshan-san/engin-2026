import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { PublicHeader } from "~/components/shared/PublicHeader";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	ProofOfWork,
	type ProofOfWorkData,
} from "~/features/profile/components/ProofOfWork";
import {
	type ScoreEvidence,
	ScoreEvidenceCard,
} from "~/features/profile/components/ScoreEvidence";
import { TrialHistory } from "~/features/profile/components/TrialHistory";
import type { Verdict } from "~/features/trialCycles/constants";
import { initials } from "~/lib/initials";

type PublicProfile = {
	name: string | null;
	username: string | null;
	image: string | null;
	headline: string | null;
	bio: string | null;
	skills: string[];
	location: string | null;
	githubUrl: string | null;
	linkedinUrl: string | null;
	portfolioUrl: string | null;
	evidence: ScoreEvidence;
	proofOfWork: ProofOfWorkData;
	evaluations: Array<{
		_id: string;
		trialTitle: string;
		startupName: string;
		verdict: Verdict | null;
		evaluation: string;
	}>;
	trialCyclesLeft: Array<{
		_id: string;
		trialTitle: string;
		startupName: string;
	}>;
	startups: Array<{
		_id: string;
		name: string;
		slug: string;
		tagline: string | null;
		role: string;
	}>;
};

type PublicProfilePageProps = {
	readonly profile: PublicProfile | null | undefined;
};

export function PublicProfilePage({ profile }: PublicProfilePageProps) {
	if (profile === undefined) {
		return (
			<div className="min-h-dvh bg-background">
				<PublicHeader />
				<PageLoading />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="min-h-dvh bg-background">
				<PublicHeader />
				<div className="mx-auto max-w-lg px-4 py-20 text-center">
					<h1 className="text-2xl font-bold">Profile not found</h1>
					<Button asChild variant="outline" className="mt-6">
						<Link to="/">Back home</Link>
					</Button>
				</div>
			</div>
		);
	}

	const displayName = profile.name ?? profile.username ?? "Contributor";
	const links = [
		{ href: profile.githubUrl, label: "GitHub" },
		{ href: profile.linkedinUrl, label: "LinkedIn" },
		{ href: profile.portfolioUrl, label: "Portfolio" },
	].filter((link): link is { href: string; label: string } =>
		Boolean(link.href),
	);

	return (
		<div className="min-h-dvh bg-background">
			<PublicHeader />
			<main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
				<div className="flex items-start gap-4">
					<Avatar className="size-16">
						{profile.image ? (
							<AvatarImage src={profile.image} alt={displayName} />
						) : null}
						<AvatarFallback>{initials(profile.name, null)}</AvatarFallback>
					</Avatar>
					<div className="min-w-0 space-y-1">
						<h1 className="text-2xl font-bold sm:text-3xl">{displayName}</h1>
						{profile.username ? (
							<p className="text-muted-foreground">@{profile.username}</p>
						) : null}
						{profile.headline ? <p>{profile.headline}</p> : null}
						{profile.location ? (
							<p className="text-sm text-muted-foreground">
								{profile.location}
							</p>
						) : null}
					</div>
				</div>

				{profile.bio ? (
					<p className="whitespace-pre-wrap text-muted-foreground">
						{profile.bio}
					</p>
				) : null}

				{profile.skills.length > 0 ? (
					<ul className="flex flex-wrap gap-2">
						{profile.skills.map((skill) => (
							<li key={skill}>
								<Badge variant="secondary">{skill}</Badge>
							</li>
						))}
					</ul>
				) : null}

				{links.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{links.map((link) => (
							<Button key={link.label} asChild variant="outline" size="sm">
								<a href={link.href} target="_blank" rel="noreferrer">
									{link.label}
								</a>
							</Button>
						))}
					</div>
				) : null}

				<ScoreEvidenceCard evidence={profile.evidence} />

				<ProofOfWork proofOfWork={profile.proofOfWork} />

				<TrialHistory
					evaluations={profile.evaluations}
					trialCyclesLeft={profile.trialCyclesLeft}
				/>

				<section className="space-y-3">
					<h2 className="text-lg font-semibold">Startups</h2>
					{profile.startups.length === 0 ? (
						<p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
							No public startups yet.
						</p>
					) : (
						<ul className="space-y-2">
							{profile.startups.map((startup) => (
								<li key={startup._id}>
									<Link
										to="/startup/$slug"
										params={{ slug: startup.slug }}
										className="block rounded-lg border p-4 hover:bg-muted/30"
									>
										<p className="font-medium">{startup.name}</p>
										<p className="text-sm text-muted-foreground">
											{startup.tagline ?? startup.role}
										</p>
									</Link>
								</li>
							))}
						</ul>
					)}
				</section>
			</main>
		</div>
	);
}
