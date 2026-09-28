import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member/pitch/")({
	component: () => (
		<StubScreen
			title="Pitch"
			emptyTitle="Pitch editor coming soon"
			emptyDescription="Edit this Startup's Pitch sections here."
		/>
	),
});
