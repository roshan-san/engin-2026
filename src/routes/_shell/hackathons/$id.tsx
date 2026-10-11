import { createFileRoute } from "@tanstack/react-router";
import { HackathonPage } from "~/features/hiring/public/HackathonPage";

export const Route = createFileRoute("/_shell/hackathons/$id")({
	component: HackathonPage,
});
