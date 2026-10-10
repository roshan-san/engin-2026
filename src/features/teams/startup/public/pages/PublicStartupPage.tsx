import { Page } from "~/components/shared/Page";
import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageLoading } from "~/components/globals/PageLoading";
import { GlowHero } from "~/components/shared/GlowHero";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { GoogleButton } from "~/features/people/auth/components/GoogleButton";
import { categoryLabel, stageLabel } from "~/features/teams/startup/constants";
import { PublicOpenings } from "~/features/teams/startup/public/components/PublicOpenings";
import { StartupAvatar } from "~/shell/topbar/StartupAvatar";

/** Chips hold user text: let them shrink and truncate instead of widening the page. */
const CHIP_CLASS = "max-w-full shrink";

type PublicStartupPageProps = {
	readonly slug: string;
};

export function PublicStartupPage({ slug }: PublicStartupPageProps) {
	const startup = useQuery(api.teams.startups.getPublic, { slug });

	if (startup === undefined) {
		return (
			<Page>
				<PageLoading />
			</Page>
		);
	}

	if (!startup) {
		return (
			<div className="mx-auto max-w-lg px-4 py-20 text-center">
				<h1 className="text-2xl font-bold">Startup not found</h1>
				<Button asChild variant="outline" className="mt-6">
					<Link to="/explore/startups">Back to Explore</Link>
				</Button>
			</div>
		);
	}

	const links = [
		{ href: startup.website, label: "Website" },
		{ href: startup.twitterUrl, label: "Twitter" },
		{ href: startup.linkedinUrl, label: "LinkedIn" },
		{ href: startup.githubUrl, label: "GitHub" },
	].filter((link): link is { href: string; label: string } =>
		Boolean(link.href),
	);
	const category = categoryLabel(startup.category);
	const stage = stageLabel(startup.stage);
	const hasChips = Boolean(
		category || stage || startup.location || startup.remote,
	);

	return (
		<>
			<Page className="space-y-8">
				<GlowHero
					eyebrow={<StartupAvatar name={startup.name} className="size-14" />}
					title={startup.name}
					subtitle={startup.tagline || undefined}
				>
					<div className="space-y-4">
						{hasChips ? (
							<div className="flex flex-wrap gap-2">
								{category ? (
									<Badge variant="outline" className={CHIP_CLASS}>
										<span className="truncate">{category}</span>
									</Badge>
								) : null}
								{stage ? (
									<Badge variant="outline" className={CHIP_CLASS}>
										<span className="truncate">{stage}</span>
									</Badge>
								) : null}
								{startup.location ? (
									<Badge variant="outline" className={CHIP_CLASS}>
										<span className="truncate">{startup.location}</span>
									</Badge>
								) : null}
								{startup.remote ? (
									<Badge variant="outline" className={CHIP_CLASS}>
										<span className="truncate">Remote-friendly</span>
									</Badge>
								) : null}
							</div>
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
					</div>
				</GlowHero>

				<div className="max-w-3xl space-y-8">
					{[
						{ heading: "About", body: startup.description },
						{ heading: "Problem", body: startup.problem },
						{ heading: "Solution", body: startup.solution },
						{ heading: "Product", body: startup.product },
						{ heading: "Traction", body: startup.traction },
						{ heading: "Team", body: startup.teamBlurb },
					].map(({ heading, body }) =>
						body ? (
							<section key={heading} className="space-y-2">
								<SectionLabel>{heading}</SectionLabel>
								<p className="whitespace-pre-wrap leading-relaxed">{body}</p>
							</section>
						) : null,
					)}

					{startup.techStack.length > 0 ? (
						<section className="space-y-2">
							<SectionLabel>Tech stack</SectionLabel>
							<ul className="flex flex-wrap gap-2">
								{startup.techStack.map((tech) => (
									<li key={tech}>
										<Badge variant="outline" className={CHIP_CLASS}>
											<span className="truncate">{tech}</span>
										</Badge>
									</li>
								))}
							</ul>
						</section>
					) : null}

					<section className="space-y-1">
						<SectionLabel>Meet the team</SectionLabel>
						{startup.isAuthenticated ? (
							<RowList>
								{startup.team.map((member) => {
									const name =
										member.user.name ?? member.user.username ?? "Member";
									return (
										<Row
											key={member.user._id}
											title={name}
											meta={
												member.user.username ? `@${member.user.username}` : null
											}
											trailing={
												<span className="capitalize">{member.role}</span>
											}
											to={member.user.username ? "/u/$username" : undefined}
											params={
												member.user.username
													? { username: member.user.username }
													: undefined
											}
										/>
									);
								})}
							</RowList>
						) : (
							<GoogleButton
								label="Sign in to see the team"
								returnTo={`/startup/${slug}`}
								className="mt-2"
							/>
						)}
					</section>

					<PublicOpenings startupId={startup._id} />
				</div>
			</Page>
		</>
	);
}
