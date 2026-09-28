import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/settings/",
)({
	component: () => (
		<StubScreen
			title="Settings"
			emptyTitle="Billing coming soon"
			emptyDescription="This Startup's Plan and usage will show up here."
		/>
	),
});
