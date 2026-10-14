import type { api } from "@convex/_generated/api";
import { getRouteApi } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { AppPage } from "~/components/AppPage";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { Page } from "~/components/Page";
import { Row, RowList } from "~/components/RowList";
import { SectionLabel } from "~/components/SectionLabel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { SignInCard } from "~/features/people/auth/SignInCard";
import { PersonName } from "~/features/people/PersonName";
import { SettingsSheet } from "~/features/people/settings/SettingsSheet";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { RatingParts } from "~/features/work/activity/RatingParts";
import { tierText } from "~/features/work/activity/tierText";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";
import { useMe } from "~/shell/useMe";
import { disciplineLabel, hackathonLine, workLine } from "./profileText";
import { useProfile } from "./useProfile";

const route = getRouteApi("/_shell/u/$username");

type Profile = NonNullable<
	FunctionReturnType<typeof api.people.users.getRecord>
>;
type Details = NonNullable<Profile["details"]>;

/** A person's Profile. Signed in, the whole Record in the app shape; signed out, a public card and Sign in. */
export function ProfilePage() {
	const { username } = route.useParams();
	const profile = useProfile(username);

	if (profile === undefined) {
		return <GlobalSpinner fill />;
	}
	if (profile === null) {
		return <GlobalNotFound />;
	}
	// The query sends `details` only to people who are signed in.
	return profile.details ? (
		<SignedInProfile profile={profile} details={profile.details} />
	) : (
		<SignedOutProfile profile={profile} />
	);
}

function SignedInProfile({
	profile,
	details,
}: {
	readonly profile: Profile;
	readonly details: Details;
}) {
	const me = useMe();
	const [isEditing, setIsEditing] = useState(false);
	const isMine = me?._id === profile._id;
	const links = [
		{ label: "LinkedIn", url: details.links.linkedinUrl },
		{ label: "GitHub", url: details.links.githubUrl },
		{ label: "Portfolio", url: details.links.portfolioUrl },
	].filter((link) => link.url !== null);

	return (
		<AppPage
			bar={{
				title: (
					<h1 className="truncate text-sm font-medium">
						<PersonName person={profile} />
					</h1>
				),
				badge: (
					<span
						className={cn(
							"text-sm font-semibold tabular-nums",
							tierText(profile.rating),
						)}
					>
						{profile.rating}
					</span>
				),
				actions: isMine ? (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsEditing(true)}
					>
						Edit profile
					</Button>
				) : null,
			}}
		>
			<div className="flex flex-col gap-10">
				<header className="flex flex-col gap-3">
					<ProfileIdentity profile={profile} />
					{details.bio ? (
						<p className="text-sm break-words whitespace-pre-wrap">
							{details.bio}
						</p>
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
				</header>

				<section className="flex flex-col gap-3">
					<RatingBadge
						rating={profile.rating}
						ratingChange={profile.ratingChange}
						isProvisional={profile.isProvisional}
					/>
					<RatingParts parts={details.parts} />
				</section>

				<section className="flex flex-col gap-2">
					<SectionLabel>Hackathons</SectionLabel>
					{details.hackathons.length === 0 ? (
						<p className="py-2 text-sm text-muted-foreground">
							No hackathons yet
						</p>
					) : (
						<RowList>
							{details.hackathons.map((hackathon) => (
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
					{details.work.length === 0 ? (
						<p className="py-2 text-sm text-muted-foreground">
							No verified work yet
						</p>
					) : (
						<RowList>
							{details.work.map((work) => (
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
			</div>
			{isMine ? (
				<SettingsSheet open={isEditing} onOpenChange={setIsEditing} />
			) : null}
		</AppPage>
	);
}

function SignedOutProfile({ profile }: { readonly profile: Profile }) {
	return (
		<Page width="narrow" className="flex flex-col gap-10">
			<header className="flex flex-col gap-6">
				<div className="flex items-start gap-4">
					<Avatar className="size-14">
						{profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
						<AvatarFallback>{initials(profile.name, null)}</AvatarFallback>
					</Avatar>
					<div className="flex min-w-0 flex-col gap-2">
						<div>
							<h1 className="text-2xl font-semibold tracking-tight break-words">
								<PersonName person={profile} />
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
					</div>
				</div>
				<RatingBadge
					rating={profile.rating}
					ratingChange={profile.ratingChange}
					isProvisional={profile.isProvisional}
				/>
			</header>
			<SignInCard>
				Sign in to see their links, Hackathons and verified work.
			</SignInCard>
		</Page>
	);
}

/** Avatar, @username and Discipline; the name itself is in the page bar. */
function ProfileIdentity({ profile }: { readonly profile: Profile }) {
	return (
		<div className="flex items-center gap-4">
			<Avatar className="size-14">
				{profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
				<AvatarFallback>{initials(profile.name, null)}</AvatarFallback>
			</Avatar>
			<div className="flex min-w-0 flex-col gap-2">
				{profile.username ? (
					<p className="text-sm text-muted-foreground">@{profile.username}</p>
				) : null}
				{profile.discipline ? (
					<Badge variant="secondary" className="self-start">
						{disciplineLabel(profile.discipline)}
					</Badge>
				) : null}
			</div>
		</div>
	);
}
