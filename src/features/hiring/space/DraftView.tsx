import type { Doc } from "@convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { Page } from "~/components/shared/Page";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { draftCard, fromBuildersGet, type HackathonDraft } from "../form/draft";
import { HackathonForm } from "../form/HackathonForm";
import { useHackathonForm } from "../form/hooks/useHackathonForm";

/** A draft: edit it, save it, or publish it. Publishing saves first. */
export function DraftView({
	hackathon,
	cards,
}: {
	readonly hackathon: Doc<"hackathons">;
	readonly cards: Doc<"cards">[];
}) {
	const { startup } = useWorkspace();
	const { update, publish } = useHackathonForm();
	const [initial] = useState<HackathonDraft>(() => ({
		job: hackathon.job,
		problem: hackathon.problem,
		weeks: hackathon.weeks,
		startsAt: hackathon.startsAt,
		buildersGet: fromBuildersGet(hackathon.buildersGet ?? null),
		cards: cards.map((card) => draftCard(card.title, card.notes)),
	}));

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<Page>
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
						onSubmit: async (draft) =>
							(await update(hackathon._id, draft)) &&
							(await publish(hackathon._id)),
					}}
				/>
			</Page>
		</div>
	);
}
