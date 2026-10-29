import { createFileRoute } from "@tanstack/react-router";
import { StartupTeamPage } from "~/pages/startup-team";

export const Route = createFileRoute("/_shell/_authed/s/$slug/team")({
	component: StartupTeamPage,
});
