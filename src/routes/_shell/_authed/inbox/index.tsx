import { createFileRoute } from "@tanstack/react-router";
import { InboxPage } from "~/features/people/inbox/pages/InboxPage";
import { InboxSegments } from "~/shell/mobile/InboxSegments";

export const Route = createFileRoute("/_shell/_authed/inbox/")({
	component: () => (
		<>
			<InboxSegments />
			<InboxPage />
		</>
	),
});
