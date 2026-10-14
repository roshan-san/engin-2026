import type { Id } from "@convex/_generated/dataModel";
import { Kbd } from "~/components/Kbd";
import { Row, RowList } from "~/components/RowList";
import { SectionLabel } from "~/components/SectionLabel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { PersonName } from "~/features/people/PersonName";
import { hackathonLine, workLine } from "~/features/people/profile/profileText";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { RatingParts } from "~/features/work/activity/RatingParts";
import { initials } from "~/lib/initials";
import { useApplicant } from "./useApplicants";

/** One Applicant: their answer, their Rating and its parts, and what they've done. */
export function ApplicantDetail({
	applicationId,
	onAccept,
	onDecline,
}: {
	readonly applicationId: Id<"applications">;
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
	const isBuilder = application.status === "building";

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-6">
				<header className="flex items-center gap-3">
					<Avatar className="size-10">
						{user.image ? <AvatarImage src={user.image} alt="" /> : null}
						<AvatarFallback>
							{initials(user.name, user.username)}
						</AvatarFallback>
					</Avatar>
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

				<section className="flex flex-col gap-2">
					<SectionLabel as="h3">Their answer</SectionLabel>
					<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
						{application.answer}
					</p>
				</section>

				<section className="flex flex-col gap-3">
					<RatingBadge
						rating={user.rating}
						ratingChange={user.ratingChange}
						isProvisional={user.isProvisional}
					/>
					<RatingParts parts={record.parts} />
				</section>

				<section className="flex flex-col gap-1">
					<SectionLabel as="h3">Hackathons</SectionLabel>
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
				</section>

				<section className="flex flex-col gap-1">
					<SectionLabel as="h3">Verified work</SectionLabel>
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
				</section>
			</div>

			<div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
				{application.status === "declined" ? null : (
					<Button variant="outline" onClick={onDecline}>
						Decline
						<Kbd>D</Kbd>
					</Button>
				)}
				{isBuilder ? null : (
					<Button onClick={onAccept}>
						Accept
						<Kbd className="border-primary-foreground/20 text-primary-foreground/60">
							A
						</Kbd>
					</Button>
				)}
			</div>
		</div>
	);
}
