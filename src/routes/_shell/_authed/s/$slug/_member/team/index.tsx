import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "~/features/teams/team/pages/TeamPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member/team/")({
	component: TeamPage,
});
