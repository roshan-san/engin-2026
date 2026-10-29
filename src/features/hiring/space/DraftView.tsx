import type { Doc } from "@convex/_generated/dataModel";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { draftPublish, usePaymentIssue, usePlan } from "~/entities/plan";
import { useWorkspace } from "~/entities/startup";
import { copyHackathonLink } from "~/features/copy-hackathon-link";
import {
	draftCard,
	fromParticipantsGet,
	type HackathonDraft,
	HackathonForm,
	useHackathonForm,
} from "~/features/edit-hackathon";
import { usePortal } from "~/features/open-billing-portal";
import { CheckoutNotice, PlansDialog } from "~/features/upgrade-plan";
import { roleLabel } from "~/shared/config/jobs";
import { dayLabel } from "~/shared/lib/dates";
import { lastDay } from "~/shared/lib/hackathonDates";
import { Button } from "~/shared/ui/button";
import { Page } from "~/shared/ui/Page";
import { Spinner } from "~/shared/ui/spinner";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

/** A draft: edit it, save it, or publish it. Publishing saves first; without Pro it opens the plans. */
export function DraftView({
	hackathon,
	cards,
}: {
	readonly hackathon: Doc<"hackathons">;
	readonly cards: Doc<"cards">[];
}) {
	const { startup } = useWorkspace();
	const { checkout } = route.useSearch();
	const { update, publish } = useHackathonForm();
	const plan = usePlan();
	const hasPaymentIssue = usePaymentIssue();
	const { openPortal, isOpening } = usePortal();
	const [isPlansOpen, setPlansOpen] = useState(false);
	const [initial] = useState<HackathonDraft>(() => ({
		job: hackathon.job,
		problem: hackathon.problem,
		weeks: hackathon.weeks,
		startsAt: hackathon.startsAt,
		participantsGet: fromParticipantsGet(hackathon.participantsGet ?? null),
		cards: cards.map((card) => draftCard(card.title, card.notes)),
	}));
	const publishing = draftPublish({
		plan,
		hasPaymentIssue,
		isBackFromCheckout: checkout === "done",
	});

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<Page>
				{checkout === "done" ? (
					<CheckoutNotice hasPlan={Boolean(plan)} />
				) : null}
				{publishing.message ? (
					<div className="mb-6 flex flex-wrap items-center gap-3">
						<p className="text-sm text-muted-foreground">
							{publishing.message}
						</p>
						{publishing.managesBilling ? (
							<Button
								variant="outline"
								size="sm"
								disabled={isOpening}
								onClick={() => void openPortal()}
							>
								{isOpening ? <Spinner /> : null}
								Manage billing
							</Button>
						) : null}
					</div>
				) : null}
				<HackathonForm
					startupName={startup.name}
					initial={initial}
					submitLabel="Save"
					onSubmit={async (draft) => {
						const isSaved = await update(hackathon._id, draft);
						if (isSaved) toast("Saved");
						return isSaved;
					}}
					secondary={{
						label: "Publish",
						disabled: publishing.isDisabled,
						// Publishing can't be undone. Without Pro the button opens the plans instead.
						confirm: (draft) =>
							publishing.opensPlans
								? null
								: {
										title: `Publish ${draft.job.role ? roleLabel(draft.job.role) : "this post"}?`,
										description: `Applications open now${
											draft.startsAt === null
												? ""
												: ` and run until ${dayLabel(lastDay(draft.startsAt))}`
										}. You can't edit the post after it's published.`,
									},
						onSubmit: async (draft) => {
							if (!(await update(hackathon._id, draft))) return false;
							if (publishing.opensPlans) {
								setPlansOpen(true);
								return true;
							}
							const isPublished = await publish(hackathon._id);
							if (isPublished) {
								toast("Published", {
									action: {
										label: "Copy link",
										onClick: () => copyHackathonLink(hackathon._id),
									},
								});
							}
							return isPublished;
						},
					}}
				/>
			</Page>
			<PlansDialog
				open={isPlansOpen}
				onOpenChange={setPlansOpen}
				returnPath={`/s/${startup.slug}/hiring/${hackathon._id}?checkout=done`}
				note="Your draft is saved."
			/>
		</div>
	);
}
