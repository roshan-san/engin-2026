import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { emptyDraft } from "./draft";
import { HackathonForm } from "./HackathonForm";
import { useHackathonForm } from "./hooks/useHackathonForm";

/** Posting a Hackathon: saved as a draft, published from its space. */
export function NewHackathonPage() {
	const { startup, isFounder } = useWorkspace();
	const { create } = useHackathonForm();
	const navigate = useNavigate();
	const [initial] = useState(() => emptyDraft(Date.now()));

	if (!isFounder) {
		return <GlobalNotFound />;
	}

	return (
		<>
			<PageHeader title="New hackathon" width="narrow" />
			<Page width="narrow">
				<HackathonForm
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
		</>
	);
}
