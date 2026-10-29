import type { Id } from "@convex/_generated/dataModel";
import { hackathonLine, workLine } from "~/entities/person";
import { Button } from "~/shared/ui/button";
import { Kbd } from "~/shared/ui/Kbd";
import { PanelBody } from "~/shared/ui/PanelBody";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import { PersonName } from "~/shared/ui/PersonName";
import { RatingBadge } from "~/shared/ui/RatingBadge";
import { RatingParts } from "~/shared/ui/RatingParts";
import { Row, RowList } from "~/shared/ui/RowList";
import { Section } from "~/shared/ui/Section";
import { Skeleton } from "~/shared/ui/skeleton";
import { useApplicant } from "./useApplicants";

/** One Applicant: their answer, their Rating and its parts, and what they've done. */
export function ApplicantDetail({
	applicationId,
	acceptRefusal,
	onAccept,
	onDecline,
}: {
	readonly applicationId: Id<"applications">;
	/** Why Accept is off, such as the Participant limit: Accept is shown but off, with the reason. */
	readonly acceptRefusal: string | null;
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
						<Button disabled={acceptRefusal !== null} onClick={onAccept}>
							Accept
							<Kbd className="border-primary-foreground/20 text-primary-foreground/60">
								A
							</Kbd>
						</Button>
						{acceptRefusal ? (
							<p className="min-w-0 text-xs text-muted-foreground">
								{acceptRefusal}
							</p>
						) : null}
					</>
				)}
			</div>
		</div>
	);
}
