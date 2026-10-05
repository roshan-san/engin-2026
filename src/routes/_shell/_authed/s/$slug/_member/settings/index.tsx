import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "~/features/teams/startup/workspace/pages/SettingsPage";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/settings/",
)({
	component: SettingsPage,
});
