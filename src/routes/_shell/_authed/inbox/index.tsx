import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute("/_shell/_authed/inbox/")({
	component: () => (
		<StubScreen
			title="Inbox"
			emptyTitle="Nothing here yet"
			emptyDescription="Notifications, Offers and Invites will show up here."
		/>
	),
});
