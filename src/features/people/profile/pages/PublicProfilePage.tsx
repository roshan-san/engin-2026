import { Page } from "~/components/shared/Page";
import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { GlowHero } from "~/components/shared/GlowHero";
import { Row, RowList } from "~/components/shared/RowList";
import { ScoreBadge } from "~/components/shared/ScoreBadge";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	HackathonHistory,
	type HackathonHistoryEntry,
} from "~/features/people/profile/components/HackathonHistory";
import {
	ProofOfWork,
	type ProofOfWorkData,
} from "~/features/people/profile/components/ProofOfWork";
import {
	type ScoreEvidence,
	ScoreEvidenceChips,
	ScoreEvidenceNote,
} from "~/features/people/profile/components/ScoreEvidence";
import { initials } from "~/lib/initials";
import { StartupAvatar } from "~/shell/topbar/StartupAvatar";

type PublicProfile = {
	name: string | null;
	username: string | null;
	image: string | null;
	bio: string | null;
	skills: string[];
	location: string | null;
	githubUrl: string | null;
	linkedinUrl: string | null;
	portfolioUrl: string | null;
	evidence: ScoreEvidence;
	proofOfWork: ProofOfWorkData;
	hackathonHistory: HackathonHistoryEntry[];
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
			<Page>
				<PageLoading />
			</Page>
		);
	}

	if (!profile) {
		return (
			<div className="mx-auto max-w-lg px-4 py-20 text-center">
				<h1 className="text-2xl font-bold">Profile not found</h1>
				<Button asChild variant="outline" className="mt-6">
					<Link to="/">Back home</Link>
				</Button>
			</div>
		);
	}

	const displayName = profile.name ?? profile.username ?? "Contributor";
	const handle = [
		profile.username ? `@${profile.username}` : null,
		profile.location,
	]
		.filter(Boolean)
		.join(" · ");
	const links = [
		{ href: profile.githubUrl, label: "GitHub" },
		{ href: profile.linkedinUrl, label: "LinkedIn" },
		{ href: profile.portfolioUrl, label: "Portfolio" },
	].filter((link): link is { href: string; label: string } =>
		Boolean(link.href),
	);

	return (
		<>
			<Page className="space-y-8">
				<GlowHero
					eyebrow={
						<Avatar className="size-14">
							{profile.image ? (
								<AvatarImage src={profile.image} alt={displayName} />
							) : null}
							<AvatarFallback>{initials(profile.name, null)}</AvatarFallback>
						</Avatar>
					}
					title={displayName}
					subtitle={handle || undefined}
				>
					<div className="space-y-4">
						<div className="flex flex-wrap items-center gap-2">
							<ScoreBadge score={profile.evidence.score} />
							<ScoreEvidenceChips evidence={profile.evidence} />
						</div>
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
					</div>
				</GlowHero>

				{profile.bio || profile.skills.length > 0 ? (
					<section className="max-w-3xl space-y-4">
						{profile.bio ? (
							<p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
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
					</section>
				) : null}

				<ProofOfWork proofOfWork={profile.proofOfWork} />

				<HackathonHistory hackathonHistory={profile.hackathonHistory} />

				<section className="space-y-1">
					<SectionLabel>Startups</SectionLabel>
					{profile.startups.length === 0 ? (
						<EmptyState title="No public Startups yet." />
					) : (
						<RowList>
							{profile.startups.map((startup) => (
								<Row
									key={startup._id}
									leading={<StartupAvatar name={startup.name} />}
									title={startup.name}
									meta={startup.tagline}
									trailing={<span className="capitalize">{startup.role}</span>}
									to="/startup/$slug"
									params={{ slug: startup.slug }}
								/>
							))}
						</RowList>
					)}
				</section>

				<ScoreEvidenceNote />
			</Page>
		</>
	);
}
