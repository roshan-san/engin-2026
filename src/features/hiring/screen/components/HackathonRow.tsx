import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { isConfirmingPayment } from "~/features/hiring/screen/checkoutStatus";
import { CancelHackathonDialog } from "~/features/hiring/trialCycles/components/CancelHackathonDialog";
import { PublishDialog } from "~/features/hiring/trialCycles/components/PublishDialog";
import {
	CANCELLABLE_STATUSES,
	TRIAL_STATUS_LABELS,
	type TrialStatus,
} from "~/features/hiring/trialCycles/constants";
import { useCancelHackathon } from "~/features/hiring/trialCycles/hooks/useCancelHackathon";
import { formatDateRange, toDateTimeInput } from "~/lib/dates";

/** Only an open hackathon (published, not started) gets its credit back. */
const CANCEL_CREDIT_CONSEQUENCE: Partial<Record<TrialStatus, string>> = {
	open: "Your credit will be returned.",
	active: "Cancelling won't return your credit.",
};

export type HackathonListItem = FunctionReturnType<
	typeof api.hiring.trialCycles.list
>[number];

type HackathonRowProps = {
	readonly slug: string;
	readonly trial: HackathonListItem;
	readonly isFounder: boolean;
	/** The viewing founder's spendable credits; members never pass it. */
	readonly creditCount?: number;
};

export function HackathonRow({
	slug,
	trial,
	isFounder,
	creditCount,
}: HackathonRowProps) {
	const [isCancelOpen, setIsCancelOpen] = useState(false);
	const [isPublishOpen, setIsPublishOpen] = useState(false);
	const { cancel, isPending } = useCancelHackathon();
	const isDraft = trial.status === "draft";
	const canCancel = isFounder && CANCELLABLE_STATUSES.includes(trial.status);

	return (
		<li className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0 space-y-1">
				<HackathonTitle slug={slug} trial={trial} isFounder={isFounder} />
				<p className="text-sm text-muted-foreground">
					{trial.roleTitle} · {formatDateRange(trial.startsAt, trial.endsAt)}
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant={isDraft ? "secondary" : "outline"}>
						{TRIAL_STATUS_LABELS[trial.status]}
					</Badge>
					<span className="text-sm text-muted-foreground">
						{trial.participantCount}/{trial.maxContributors} participants
					</span>
				</div>
				{isConfirmingPayment(trial, creditCount) ? (
					<div className="flex items-start gap-2 pt-1 text-sm text-muted-foreground">
						<Spinner className="mt-0.5 shrink-0" />
						<p>
							Confirming payment… this publishes automatically.
							<br />
							Didn&apos;t finish paying? Publish to pay again.
						</p>
					</div>
				) : null}
			</div>

			{isFounder && (isDraft || canCancel) ? (
				<div className="flex shrink-0 flex-wrap gap-2">
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
								to="/s/$slug/hiring/$trialCycleId/edit"
								params={{ slug, trialCycleId: trial._id }}
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
			) : null}

			{isFounder && isDraft && isPublishOpen ? (
				<PublishDialog
					open
					onOpenChange={setIsPublishOpen}
					slug={slug}
					trialCycleId={trial._id}
					title={trial.title}
					schedule={{
						startsAt: toDateTimeInput(trial.startsAt),
						endsAt: toDateTimeInput(trial.endsAt),
						applicationDeadline:
							trial.applicationDeadline === undefined
								? ""
								: toDateTimeInput(trial.applicationDeadline),
					}}
					onPublished={() => setIsPublishOpen(false)}
				/>
			) : null}

			{canCancel ? (
				<CancelHackathonDialog
					open={isCancelOpen}
					onOpenChange={setIsCancelOpen}
					title={trial.title}
					status={trial.status}
					consequence={CANCEL_CREDIT_CONSEQUENCE[trial.status]}
					isPending={isPending}
					onConfirm={async () => {
						if (await cancel(trial._id)) {
							setIsCancelOpen(false);
						}
					}}
				/>
			) : null}
		</li>
	);
}

/** Drafts open their edit page; published hackathons open their run screen. */
function HackathonTitle({
	slug,
	trial,
	isFounder,
}: Omit<HackathonRowProps, "creditCount">) {
	if (trial.status === "draft") {
		return isFounder ? (
			<Link
				to="/s/$slug/hiring/$trialCycleId/edit"
				params={{ slug, trialCycleId: trial._id }}
				className="block truncate font-medium hover:underline"
			>
				{trial.title}
			</Link>
		) : (
			<p className="truncate font-medium">{trial.title}</p>
		);
	}

	return (
		<Link
			to="/s/$slug/trials/$trialCycleId"
			params={{ slug, trialCycleId: trial._id }}
			className="block truncate font-medium hover:underline"
		>
			{trial.title}
		</Link>
	);
}
