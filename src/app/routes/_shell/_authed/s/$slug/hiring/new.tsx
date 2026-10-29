import { createFileRoute } from "@tanstack/react-router";
import { NewHackathonPage } from "~/pages/new-hackathon";

export const Route = createFileRoute("/_shell/_authed/s/$slug/hiring/new")({
	component: NewHackathonPage,
});
