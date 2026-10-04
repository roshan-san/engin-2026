import { createFileRoute } from "@tanstack/react-router";
import { HiringPage } from "~/features/hiring/screen/pages/HiringPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member/hiring/")(
	{
		component: () => <HiringPage />,
	},
);
