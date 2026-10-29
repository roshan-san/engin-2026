import type { api } from "@convex/_generated/api";
import { getRouteApi, Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useRef, useState } from "react";
import {
	disciplineLabel,
	hackathonLine,
	useMe,
	useProfile,
	workLine,
} from "~/entities/person";
import { SignInCard } from "~/features/sign-in";
import { cn } from "~/shared/lib/cn";
import { tierText } from "~/shared/lib/tierText";
import { AppPage } from "~/shared/ui/AppPage";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { GlobalNotFound } from "~/shared/ui/GlobalNotFound";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import { Page } from "~/shared/ui/Page";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import { PersonName } from "~/shared/ui/PersonName";
import { RatingBadge } from "~/shared/ui/RatingBadge";
import { RatingParts } from "~/shared/ui/RatingParts";
import { Row, RowList } from "~/shared/ui/RowList";
import { Section } from "~/shared/ui/Section";
import { SettingsSheet } from "~/widgets/account";

const route = getRouteApi("/_shell/u/$username");

type Profile = NonNullable<
	FunctionReturnType<typeof api.people.users.getRecord>
>;
type Details = NonNullable<Profile["details"]>;

/** A person's Profile. Signed in, the whole Record in the app shape; signed out, a public card and Sign in. */
export function ProfilePage() {
	const { username } = route.useParams();
	const me = useMe();
	const profile = useHeldOwnProfile(username, useProfile(username), me?._id);

	if (profile === undefined) {
		return <GlobalSpinner fill />;
	}
	if (profile === null) {
		return (
			<GlobalNotFound
				title={`No one is @${username}`}
				action={
					<Button asChild>
						<Link to="/explore/startups">Explore startups</Link>
					</Button>
				}
			/>
		);
	}
	// The query sends `details` only to people who are signed in.
	return profile.details ? (
		<SignedInProfile profile={profile} details={profile.details} />
	) : (
		<SignedOutProfile profile={profile} />
	);
}

/**
 * Renaming yourself empties the query for your old username a moment before
 * the page navigates to the new one. Keep showing your own profile through that
 * moment so the not-found page doesn't flash.
 */
function useHeldOwnProfile(
	username: string,
	profile: Profile | null | undefined,
	myId: Profile["_id"] | undefined,
) {
	const held = useRef<{ username: string; profile: Profile } | null>(null);
	if (profile) {
		held.current = { username, profile };
	}
	if (
		profile === null &&
		held.current?.username === username &&
		held.current.profile._id === myId
	) {
		return held.current.profile;
	}
	return profile;
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
			<header className="flex flex-col gap-3">
				<ProfileIdentity profile={profile} />
				{details.bio ? (
					<p className="text-sm break-words whitespace-pre-wrap">
						{details.bio}
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

			<Section label="Hackathons">
				{details.hackathons.length === 0 ? (
					<div className="flex flex-wrap items-center gap-3 py-2">
						<p className="text-sm text-muted-foreground">No hackathons yet</p>
						{isMine ? (
							<Button asChild variant="outline" size="sm">
								<Link to="/explore/hackathons">Find a hackathon</Link>
							</Button>
						) : null}
					</div>
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
			</Section>

			<Section label="Verified work">
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
			</Section>
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
					<PersonAvatar person={profile} size={64} />
					<div className="flex min-w-0 flex-col gap-2">
						<div>
							<h1 className="text-2xl font-semibold break-words">
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
				Sign in to see their bio, Hackathons and verified work.
			</SignInCard>
		</Page>
	);
}

/** Avatar, @username and Discipline; the name itself is in the page bar. */
function ProfileIdentity({ profile }: { readonly profile: Profile }) {
	return (
		<div className="flex items-center gap-4">
			<PersonAvatar person={profile} size={64} />
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
