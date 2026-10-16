import type { Doc } from "@convex/_generated/dataModel";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Page } from "~/components/Page";
import { Button } from "~/components/ui/button";
import { CheckoutNotice } from "~/features/billing/CheckoutNotice";
import { draftPublish } from "~/features/billing/draftPublish";
import { PlansDialog } from "~/features/billing/PlansDialog";
import { usePaymentIssue } from "~/features/billing/usePaymentIssue";
import { usePlan } from "~/features/billing/usePlan";
import { usePortal } from "~/features/billing/usePortal";
import { useWorkspace } from "~/features/work/board/StartupContext";
import {
	draftCard,
	fromParticipantsGet,
	type HackathonDraft,
} from "../form/draft";
import { HackathonForm } from "../form/HackathonForm";
import { useHackathonForm } from "../form/useHackathonForm";

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
	const { openPortal } = usePortal();
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
								onClick={() => void openPortal()}
							>
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
						onSubmit: async (draft) => {
							if (!(await update(hackathon._id, draft))) return false;
							if (publishing.opensPlans) {
								setPlansOpen(true);
								return true;
							}
							return await publish(hackathon._id);
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
