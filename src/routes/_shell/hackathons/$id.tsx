import { createFileRoute } from "@tanstack/react-router";
import { PublicHackathonPage } from "~/pages/public-hackathon";

export const Route = createFileRoute("/_shell/hackathons/$id")({
	component: PublicHackathonPage,
});
