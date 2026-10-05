import { createFileRoute } from "@tanstack/react-router";
import { ActivityPage } from "~/features/teams/startup/workspace/pages/ActivityPage";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/activity/",
)({
	component: ActivityPage,
});
