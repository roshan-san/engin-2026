import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member/hiring/")(
	{
		component: () => (
			<StubScreen
				title="Hiring"
				emptyTitle="No open Roles yet"
				emptyDescription="Roles, Trial Cycles and Applicants will show up here."
			/>
		),
	},
);
