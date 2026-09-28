import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member/cycles/")(
	{
		component: () => (
			<StubScreen
				title="Cycles"
				emptyTitle="No Cycles yet"
				emptyDescription="This Startup's Cycles will show up here."
			/>
		),
	},
);
