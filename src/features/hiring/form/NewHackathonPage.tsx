import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppPage, BackLink } from "~/components/AppPage";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { Page } from "~/components/Page";
import { useWorkspace } from "~/features/work/StartupContext";
import { emptyDraft } from "./draft";
import { HackathonForm } from "./HackathonForm";
import { useHackathonForm } from "./useHackathonForm";

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
		<AppPage
			bar={{
				back: (
					<BackLink
						label="Hiring"
						link={{ to: "/s/$slug/hiring", params: { slug: startup.slug } }}
					/>
				),
				title: <h1 className="truncate text-sm font-medium">New hackathon</h1>,
			}}
			width="full"
		>
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
		</AppPage>
	);
}
