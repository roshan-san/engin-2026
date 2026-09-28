import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/cycles/$cycleId",
)({
	component: () => (
		<StubScreen
			title="Cycle"
			emptyTitle="Board coming soon"
			emptyDescription="This Cycle's Pulses will show up here."
		/>
	),
});
