import type { Doc } from "@convex/_generated/dataModel";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/entities/startup";
import {
	draftOf,
	type HackathonDraft,
	HackathonForm,
	useHackathonForm,
} from "~/features/edit-hackathon";
import { Button } from "~/shared/ui/button";
import { Page } from "~/shared/ui/Page";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

/** A published post nobody has applied to yet: edit it, then go back to Screening. If someone applies meanwhile, it says so and Save is refused. */
export function EditPostView({
	hackathon,
	cards,
}: {
	readonly hackathon: Doc<"hackathons">;
	readonly cards: Doc<"cards">[];
}) {
	const { startup } = useWorkspace();
	const { update } = useHackathonForm();
	const navigate = route.useNavigate();
	const [initial] = useState<HackathonDraft>(() => draftOf(hackathon, cards));

	function close() {
		void navigate({ search: (search) => ({ ...search, edit: undefined }) });
	}

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<Page>
				<div className="mb-6 flex flex-wrap items-center gap-3">
					{/* Stays open when someone applies mid-edit, so the change isn't lost without a word. */}
					<p className="text-sm text-muted-foreground">
						{hackathon.applicantCount > 0
							? "Someone has applied, so the post can't change now."
							: "You can edit the post until someone applies."}
					</p>
					<Button variant="ghost" size="sm" onClick={close}>
						Cancel
					</Button>
				</div>
				<HackathonForm
					startupName={startup.name}
					initial={initial}
					savedStart={hackathon.startsAt}
					submitLabel="Save"
					onSubmit={async (draft) => {
						const isSaved = await update(hackathon._id, draft);
						if (isSaved) {
							toast("Saved");
							close();
						}
						return isSaved;
					}}
				/>
			</Page>
		</div>
	);
}
