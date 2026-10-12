import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { Page } from "~/components/shared/Page";
import { PanelHeader } from "~/components/shared/PanelHeader";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { emptyDraft } from "./draft";
import { HackathonForm } from "./HackathonForm";
import { useHackathonForm } from "./hooks/useHackathonForm";

/** Posting a Hackathon: saved as a draft, published from its space. Framed like the space it becomes. */
export function NewHackathonPage() {
	const { startup, isFounder } = useWorkspace();
	const { create } = useHackathonForm();
	const navigate = useNavigate();
	const [initial] = useState(() => emptyDraft(Date.now()));

	if (!isFounder) {
		return <GlobalNotFound />;
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<h1 className="sr-only">New hackathon</h1>
			<PanelHeader className="gap-3 md:px-6">
				<span className="truncate text-xs text-muted-foreground">
					Saved as a draft. Publish it when it reads right.
				</span>
			</PanelHeader>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<Page>
					<HackathonForm
						startupName={startup.name}
						initial={initial}
						submitLabel="Save draft"
						onSubmit={async (draft) => {
							const id = await create(startup._id, draft);
							if (!id) return false;
							await navigate({
								to: "/s/$slug/hiring/$id",
								params: { slug: startup.slug, id },
							});
							return true;
						}}
					/>
				</Page>
			</div>
		</div>
	);
}
