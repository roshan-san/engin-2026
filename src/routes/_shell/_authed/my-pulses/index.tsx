import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute("/_shell/_authed/my-pulses/")({
	component: () => (
		<StubScreen
			title="My Pulses"
			emptyTitle="No Pulses yet"
			emptyDescription="Pulses assigned to you across every Startup will show up here."
		/>
	),
});
