import type { Doc } from "@convex/_generated/dataModel";
import { publishBlockFor, publishBlockMessage } from "@convex/shared/plans";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Page } from "~/components/Page";
import { CheckoutNotice } from "~/features/billing/CheckoutNotice";
import { PlansDialog } from "~/features/billing/PlansDialog";
import { usePlan } from "~/features/billing/usePlan";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { draftCard, fromBuildersGet, type HackathonDraft } from "../form/draft";
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
	const [isPlansOpen, setPlansOpen] = useState(false);
	const [initial] = useState<HackathonDraft>(() => ({
		job: hackathon.job,
		problem: hackathon.problem,
		weeks: hackathon.weeks,
		startsAt: hackathon.startsAt,
		buildersGet: fromBuildersGet(hackathon.buildersGet ?? null),
		cards: cards.map((card) => draftCard(card.title, card.notes)),
	}));
	// While the plan loads, Publish goes to the server, which checks it anyway.
	const block = plan === undefined ? null : publishBlockFor(plan);
	const isWaiting = block !== null && block.reason !== "no_pro";

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<Page>
				{checkout === "done" ? (
					<CheckoutNotice hasPlan={Boolean(plan)} />
				) : null}
				{isWaiting && block ? (
					<p className="mb-6 text-sm text-muted-foreground">
						{publishBlockMessage(block)}
					</p>
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
						disabled: isWaiting,
						onSubmit: async (draft) => {
							if (!(await update(hackathon._id, draft))) return false;
							if (block?.reason === "no_pro") {
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
