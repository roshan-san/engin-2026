import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";
import { InboxSegments } from "~/shell/mobile/InboxSegments";

export const Route = createFileRoute("/_shell/_authed/inbox/")({
	component: () => (
		<>
			<InboxSegments />
			<StubScreen
				title="Inbox"
				emptyTitle="Nothing here yet"
				emptyDescription="Notifications, Offers and Invites will show up here."
			/>
		</>
	),
});
