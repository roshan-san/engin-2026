import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "~/features/startups/team/TeamPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/team")({
	component: TeamPage,
});
