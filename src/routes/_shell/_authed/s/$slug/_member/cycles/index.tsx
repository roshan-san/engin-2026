import { createFileRoute } from "@tanstack/react-router";
import { CyclesPage } from "~/features/work/cycles/pages/CyclesPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member/cycles/")(
	{
		component: () => <CyclesPage />,
	},
);
