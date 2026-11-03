import type { Id } from "@convex/_generated/dataModel";
import { ArrowLeftIcon, MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { useApplicant } from "~/entities/application";
import { useHackathonThreads } from "~/entities/message";
import { hackathonLine, workLine } from "~/entities/person";
import { useScreening } from "~/features/screen-applicant";
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
import { UnreadDot } from "~/shared/ui/UnreadDot";
import { ThreadPanel } from "~/widgets/chat-panel";

/** One Applicant: their answer, their Momentum and its parts, what they've done, and your private thread with them. */
export function ApplicantDetail({
	applicationId,
	userId,
	acceptRefusal,
	onAccept,
	onDecline,
}: {
	readonly applicationId: Id<"applications">;
	/** The Founder. */
	readonly userId: Id<"users">;
	/** Why Accept is off, such as the Participant limit: Accept is shown but off, with the reason. */
	readonly acceptRefusal: string | null;
	readonly onAccept: () => void;
	readonly onDecline: () => void;
}) {
	const applicant = useApplicant(applicationId);
	const threads = useHackathonThreads(
		applicant?.application.hackathonId ?? null,
	);
	const { ask } = useScreening();
	const [isAsking, setIsAsking] = useState(false);

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
	const isDeclined = application.status === "declined";
	const thread = threads?.find(
		(candidate) =>
			candidate.kind === "private" && candidate.participant?._id === user._id,
	);
	const name = user.name ?? user.username ?? "them";

	if (isAsking) {
		return (
			<ThreadPanel
				threadId={thread?._id}
				title={
					<Button
						variant="ghost"
						size="sm"
						className="-ml-2"
						onClick={() => setIsAsking(false)}
					>
						<ArrowLeftIcon />
						{name}
					</Button>
				}
				userId={userId}
				placeholder={`Ask ${name}`}
				emptyNote="Only you two see this. It doesn't change your decision."
				isReadOnly={isDeclined}
			/>
		);
	}

	async function openThread() {
		if (thread || (await ask(applicationId))) setIsAsking(true);
	}

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
						rating={user.momentum}
						ratingChange={user.momentumChange}
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

				<Section label="Approved work" as="h3">
					{record.work.length === 0 ? (
						<p className="py-2 text-sm text-muted-foreground">
							No approved work yet
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
				{thread || !isDeclined ? (
					<Button variant="ghost" onClick={() => void openThread()}>
						<MessageCircleIcon />
						{thread ? "Thread" : "Ask"}
						{thread?.unread ? <UnreadDot /> : null}
					</Button>
				) : null}
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
