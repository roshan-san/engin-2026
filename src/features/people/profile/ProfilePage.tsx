import { getRouteApi } from "@tanstack/react-router";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { Page } from "~/components/Page";
import { Row, RowList } from "~/components/RowList";
import { SectionLabel } from "~/components/SectionLabel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { RatingParts } from "~/features/work/activity/RatingParts";
import { initials } from "~/lib/initials";
import { useProfile } from "./hooks/useProfile";
import { disciplineLabel, hackathonLine, workLine } from "./profileText";

const route = getRouteApi("/_shell/u/$username");

/** A person's public Record: Rating, Hackathons and verified work. */
export function ProfilePage() {
	const { username } = route.useParams();
	const profile = useProfile(username);

	if (profile === undefined) {
		return <GlobalSpinner fill />;
	}
	if (profile === null) {
		return <GlobalNotFound />;
	}

	const links = [
		{ label: "LinkedIn", url: profile.links.linkedinUrl },
		{ label: "GitHub", url: profile.links.githubUrl },
		{ label: "Portfolio", url: profile.links.portfolioUrl },
	].filter((link) => link.url !== null);

	return (
		<Page width="narrow" className="flex flex-col gap-10">
			<header className="flex items-start gap-4">
				<Avatar className="size-14">
					{profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
					<AvatarFallback>{initials(profile.name, null)}</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-col gap-2">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight break-words">
							{profile.name ?? profile.username}
						</h1>
						{profile.username ? (
							<p className="text-sm text-muted-foreground">
								@{profile.username}
							</p>
						) : null}
					</div>
					{profile.discipline ? (
						<Badge variant="secondary" className="self-start">
							{disciplineLabel(profile.discipline)}
						</Badge>
					) : null}
					{links.length > 0 ? (
						<p className="flex flex-wrap gap-x-3 text-xs">
							{links.map((link) => (
								<a
									key={link.label}
									href={link.url ?? undefined}
									target="_blank"
									rel="noreferrer"
									className="text-link underline-offset-4 hover:underline"
								>
									{link.label}
								</a>
							))}
						</p>
					) : null}
				</div>
			</header>

			<section className="flex flex-col gap-3">
				<RatingBadge
					rating={profile.rating}
					ratingChange={profile.ratingChange}
					isProvisional={profile.isProvisional}
				/>
				<RatingParts parts={profile.parts} />
			</section>

			<section className="flex flex-col gap-2">
				<SectionLabel>Hackathons</SectionLabel>
				{profile.hackathons.length === 0 ? (
					<p className="py-2 text-sm text-muted-foreground">
						No hackathons yet
					</p>
				) : (
					<RowList>
						{profile.hackathons.map((hackathon) => (
							<Row
								key={`${hackathon.startup.slug}-${hackathon.endsAt}`}
								title={hackathonLine(hackathon)}
								to="/startups/$slug"
								params={{ slug: hackathon.startup.slug }}
							/>
						))}
					</RowList>
				)}
			</section>

			<section className="flex flex-col gap-2">
				<SectionLabel>Verified work</SectionLabel>
				{profile.work.length === 0 ? (
					<p className="py-2 text-sm text-muted-foreground">
						No verified work yet
					</p>
				) : (
					<RowList>
						{profile.work.map((work) => (
							<Row
								key={work.startup.slug}
								title={workLine(work)}
								to="/startups/$slug"
								params={{ slug: work.startup.slug }}
							/>
						))}
					</RowList>
				)}
			</section>
		</Page>
	);
}
