import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { LiveBadge } from "~/components/shared/LiveBadge";
import { Row } from "~/components/shared/RowList";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { CancelHackathonDialog } from "~/features/hiring/hackathons/components/CancelHackathonDialog";
import { PublishDialog } from "~/features/hiring/hackathons/components/PublishDialog";
import {
	CANCELLABLE_STATUSES,
	type HackathonStatus,
} from "~/features/hiring/hackathons/constants";
import { useCancelHackathon } from "~/features/hiring/hackathons/hooks/useCancelHackathon";
import { isConfirmingPayment } from "~/features/hiring/screen/checkoutStatus";
import { formatDateRange, toDateTimeInput } from "~/lib/dates";

/** Only an open hackathon (published, not started) gets its credit back. */
const CANCEL_CREDIT_CONSEQUENCE: Partial<Record<HackathonStatus, string>> = {
	open: "Your credit will be returned.",
	active: "Cancelling won't return your credit.",
};

export type HackathonListItem = FunctionReturnType<
	typeof api.hiring.hackathons.list
>[number];

type HackathonRowProps = {
	readonly slug: string;
	readonly hackathon: HackathonListItem;
	readonly isFounder: boolean;
	/** The viewing founder's spendable credits; members never pass it. */
	readonly creditCount?: number;
};

export function HackathonRow({
	slug,
	hackathon,
	isFounder,
	creditCount,
}: HackathonRowProps) {
	const [isCancelOpen, setIsCancelOpen] = useState(false);
	const [isPublishOpen, setIsPublishOpen] = useState(false);
	const { cancel, isPending } = useCancelHackathon();
	const isDraft = hackathon.status === "draft";
	const canCancel =
		isFounder && CANCELLABLE_STATUSES.includes(hackathon.status);
	const hasActions = isFounder && (isDraft || canCancel);
	const isLinked = isFounder || !isDraft;

	return (
		<>
			{/* The title link stretches over the row; the actions sit above it. */}
			<Row
				className={
					isLinked ? "relative transition-colors hover:bg-accent" : undefined
				}
				title={
					<HackathonTitle
						slug={slug}
						hackathon={hackathon}
						isFounder={isFounder}
					/>
				}
				meta={
					<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 whitespace-normal">
						<LiveBadge status={hackathon.status} />
						<span>{hackathon.roleTitle}</span>
						<span>{formatDateRange(hackathon.startsAt, hackathon.endsAt)}</span>
						<span className="tabular-nums">
							{hackathon.participantCount}/{hackathon.maxParticipants}{" "}
							participants
						</span>
						{isConfirmingPayment(hackathon, creditCount) ? (
							<span className="flex basis-full items-start gap-2 pt-1">
								<Spinner className="mt-0.5 shrink-0" />
								<span>
									Confirming payment… this publishes automatically.
									<br />
									Didn&apos;t finish paying? Publish to pay again.
								</span>
							</span>
						) : null}
					</div>
				}
				trailing={
					hasActions ? (
						<div className="relative flex flex-wrap justify-end gap-2">
							{isDraft ? (
								<Button
									type="button"
									size="sm"
									onClick={() => setIsPublishOpen(true)}
								>
									Publish
								</Button>
							) : null}
							{isDraft ? (
								<Button asChild variant="outline" size="sm">
									<Link
										to="/s/$slug/hiring/$hackathonId/edit"
										params={{ slug, hackathonId: hackathon._id }}
									>
										Edit
									</Link>
								</Button>
							) : null}
							{canCancel ? (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setIsCancelOpen(true)}
								>
									Cancel
								</Button>
							) : null}
						</div>
					) : null
				}
			/>

			{isFounder && isDraft && isPublishOpen ? (
				<PublishDialog
					open
					onOpenChange={setIsPublishOpen}
					slug={slug}
					hackathonId={hackathon._id}
					title={hackathon.title}
					schedule={{
						startsAt: toDateTimeInput(hackathon.startsAt),
						endsAt: toDateTimeInput(hackathon.endsAt),
						applicationDeadline:
							hackathon.applicationDeadline === undefined
								? ""
								: toDateTimeInput(hackathon.applicationDeadline),
					}}
					onPublished={() => setIsPublishOpen(false)}
				/>
			) : null}

			{canCancel ? (
				<CancelHackathonDialog
					open={isCancelOpen}
					onOpenChange={setIsCancelOpen}
					title={hackathon.title}
					status={hackathon.status}
					consequence={CANCEL_CREDIT_CONSEQUENCE[hackathon.status]}
					isPending={isPending}
					onConfirm={async () => {
						if (await cancel(hackathon._id)) {
							setIsCancelOpen(false);
						}
					}}
				/>
			) : null}
		</>
	);
}

/** Drafts open their edit page; published hackathons open their run screen. */
function HackathonTitle({
	slug,
	hackathon,
	isFounder,
}: Omit<HackathonRowProps, "creditCount">) {
	if (hackathon.status === "draft") {
		return isFounder ? (
			<Link
				to="/s/$slug/hiring/$hackathonId/edit"
				params={{ slug, hackathonId: hackathon._id }}
				className="block truncate after:absolute after:inset-0"
			>
				{hackathon.title}
			</Link>
		) : (
			<span className="block truncate">{hackathon.title}</span>
		);
	}

	return (
		<Link
			to="/s/$slug/hackathons/$hackathonId"
			params={{ slug, hackathonId: hackathon._id }}
			className="block truncate after:absolute after:inset-0"
		>
			{hackathon.title}
		</Link>
	);
}
