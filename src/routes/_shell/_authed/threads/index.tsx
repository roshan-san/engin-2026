import { createFileRoute } from "@tanstack/react-router";
import { ThreadsPage } from "~/features/hiring/threads/pages/ThreadsPage";
import { InboxSegments } from "~/shell/mobile/InboxSegments";

export const Route = createFileRoute("/_shell/_authed/threads/")({
	component: () => (
		<>
			<InboxSegments />
			<ThreadsPage />
		</>
	),
});
