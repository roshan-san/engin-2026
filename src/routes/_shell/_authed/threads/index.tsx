import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";
import { InboxSegments } from "~/shell/mobile/InboxSegments";

export const Route = createFileRoute("/_shell/_authed/threads/")({
	component: () => (
		<>
			<InboxSegments />
			<StubScreen
				title="Threads"
				emptyTitle="No Threads yet"
				emptyDescription="Your Trial Cycle Threads with Founders will show up here."
			/>
		</>
	),
});
