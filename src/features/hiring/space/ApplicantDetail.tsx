import type { Id } from "@convex/_generated/dataModel";
import { MAX_PARTICIPANTS } from "@convex/shared/limits";
import { Kbd } from "~/components/Kbd";
import { PanelBody } from "~/components/PanelBody";
import { Row, RowList } from "~/components/RowList";
import { Section } from "~/components/Section";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { PersonAvatar } from "~/features/people/PersonAvatar";
import { PersonName } from "~/features/people/PersonName";
import { hackathonLine, workLine } from "~/features/people/profile/profileText";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { RatingParts } from "~/features/work/activity/RatingParts";
import { useApplicant } from "./useApplicants";

/** One Applicant: their answer, their Rating and its parts, and what they've done. */
export function ApplicantDetail({
	applicationId,
	canAccept,
	onAccept,
	onDecline,
}: {
	readonly applicationId: Id<"applications">;
	/** False at the Participant limit: Accept is shown but off, with the reason. */
	readonly canAccept: boolean;
	readonly onAccept: () => void;
	readonly onDecline: () => void;
}) {
	const applicant = useApplicant(applicationId);

	if (!applicant) {
		return (
			<div className="flex flex-col gap-3 p-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}

	const { application, user, record } = applicant;
	const isParticipant = application.status === "participating";

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<PanelBody>
				<header className="flex items-center gap-3">
					<PersonAvatar person={user} size={40} />
					<div className="flex min-w-0 flex-col">
						<h2 className="truncate font-medium">
							<PersonName person={user} />
						</h2>
						{user.username ? (
							<span className="text-xs text-muted-foreground">
								@{user.username}
							</span>
						) : null}
					</div>
				</header>

				<Section label="Their answer" as="h3">
					<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
						{application.answer}
					</p>
				</Section>

				<section className="flex flex-col gap-3">
					<RatingBadge
						rating={user.rating}
						ratingChange={user.ratingChange}
						isProvisional={user.isProvisional}
					/>
					<RatingParts parts={record.parts} />
				</section>

				<Section label="Hackathons" as="h3">
					{record.hackathons.length === 0 ? (
						<p className="py-2 text-sm text-muted-foreground">
							No hackathons yet
						</p>
					) : (
						<RowList>
							{record.hackathons.map((hackathon) => (
								<Row
									key={`${hackathon.startup.slug}-${hackathon.endsAt}`}
									title={hackathonLine(hackathon)}
								/>
							))}
						</RowList>
					)}
				</Section>

				<Section label="Verified work" as="h3">
					{record.work.length === 0 ? (
						<p className="py-2 text-sm text-muted-foreground">
							No verified work yet
						</p>
					) : (
						<RowList>
							{record.work.map((work) => (
								<Row key={work.startup.slug} title={workLine(work)} />
							))}
						</RowList>
					)}
				</Section>
			</PanelBody>

			<div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border p-3">
				{application.status === "declined" ? null : (
					<Button variant="outline" onClick={onDecline}>
						{isParticipant ? "Remove" : "Decline"}
						<Kbd>D</Kbd>
					</Button>
				)}
				{isParticipant ? null : (
					<>
						<Button disabled={!canAccept} onClick={onAccept}>
							Accept
							<Kbd className="border-primary-foreground/20 text-primary-foreground/60">
								A
							</Kbd>
						</Button>
						{canAccept ? null : (
							<p className="min-w-0 text-xs text-muted-foreground">
								{MAX_PARTICIPANTS} Participants is the limit
							</p>
						)}
					</>
				)}
			</div>
		</div>
	);
}
