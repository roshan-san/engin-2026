import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/activity/",
)({
	component: () => (
		<StubScreen
			title="Activity"
			emptyTitle="No activity yet"
			emptyDescription="This Startup's events will show up here."
		/>
	),
});
