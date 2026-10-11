import { createFileRoute } from "@tanstack/react-router";
import { NewHackathonPage } from "~/features/hiring/form/NewHackathonPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/hiring/new")({
	component: NewHackathonPage,
});
