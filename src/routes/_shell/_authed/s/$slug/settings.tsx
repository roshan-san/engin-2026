import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "~/features/startups/settings/SettingsPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/settings")({
	component: SettingsPage,
});
