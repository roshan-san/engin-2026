import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageLoading } from "~/components/globals/PageLoading";
import { PublicHeader } from "~/components/shared/PublicHeader";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { categoryLabel, stageLabel } from "~/features/startup/constants";
import { PublicOpenings } from "~/features/startup/public/components/PublicOpenings";
import { useFollowStartup } from "~/features/startup/public/hooks/useFollowStartup";

type PublicStartupPageProps = {
	readonly slug: string;
};

export function PublicStartupPage({ slug }: PublicStartupPageProps) {
	const startup = useQuery(api.startups.getPublic, { slug });
	const { toggle, isPending } = useFollowStartup(startup?._id);

	if (startup === undefined) {
		return (
			<div className="min-h-dvh bg-background">
				<PublicHeader />
				<PageLoading />
			</div>
		);
	}

	if (!startup) {
		return (
			<div className="min-h-dvh bg-background">
				<PublicHeader />
				<div className="mx-auto max-w-lg px-4 py-20 text-center">
					<h1 className="text-2xl font-bold">Startup not found</h1>
					<Button asChild variant="outline" className="mt-6">
						<Link to="/explore">Back to Explore</Link>
					</Button>
				</div>
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

	return (
		<div className="min-h-dvh bg-background">
			<PublicHeader />
			<main className="mx-auto max-w-2xl space-y-10 px-4 py-10">
				<section className="space-y-4">
					<div className="flex flex-wrap gap-2">
						{categoryLabel(startup.category) ? (
							<Badge variant="secondary">
								{categoryLabel(startup.category)}
							</Badge>
						) : null}
						{stageLabel(startup.stage) ? (
							<Badge variant="outline">{stageLabel(startup.stage)}</Badge>
						) : null}
					</div>
					<h1 className="text-3xl font-bold sm:text-4xl">{startup.name}</h1>
					{startup.tagline ? (
						<p className="text-lg text-muted-foreground">{startup.tagline}</p>
					) : null}
					<div className="flex flex-wrap items-center gap-2">
						{startup.isAuthenticated ? (
							<Button
								onClick={() => void toggle()}
								disabled={isPending}
								variant={startup.isFollowing ? "outline" : "default"}
							>
								{startup.isFollowing ? "Following" : "Follow"}
							</Button>
						) : (
							<Button asChild>
								<Link to="/">Sign in to follow</Link>
							</Button>
						)}
						<p className="text-sm text-muted-foreground">
							{startup.followerCount} followers
						</p>
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
				</section>

				{startup.description ? (
					<section className="space-y-2">
						<h2 className="text-lg font-semibold">About</h2>
						<p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
							{startup.description}
						</p>
					</section>
				) : null}

				<section className="space-y-3">
					<h2 className="text-lg font-semibold">Team</h2>
					<ul className="space-y-2">
						{startup.team.map((member) => (
							<li
								key={member.user._id}
								className="flex items-center justify-between rounded-lg border px-4 py-3"
							>
								<div>
									<p className="font-medium">
										{member.user.name ?? member.user.username ?? "Member"}
									</p>
									{member.user.username ? (
										<Link
											to="/u/$username"
											params={{ username: member.user.username }}
											className="text-sm text-muted-foreground hover:text-foreground"
										>
											@{member.user.username}
										</Link>
									) : null}
								</div>
								<Badge variant="secondary">{member.role}</Badge>
							</li>
						))}
					</ul>
				</section>

				<PublicOpenings
					startupId={startup._id}
					isAuthenticated={startup.isAuthenticated}
				/>
			</main>
		</div>
	);
}
