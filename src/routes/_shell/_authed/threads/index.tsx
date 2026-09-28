import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute("/_shell/_authed/threads/")({
	component: () => (
		<StubScreen
			title="Threads"
			emptyTitle="No Threads yet"
			emptyDescription="Your Trial Cycle Threads with Founders will show up here."
		/>
	),
});
