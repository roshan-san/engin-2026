import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member/team/")({
	component: () => (
		<StubScreen
			title="Team"
			emptyTitle="No Members yet"
			emptyDescription="This Startup's Members and pending Invites will show up here."
		/>
	),
});
