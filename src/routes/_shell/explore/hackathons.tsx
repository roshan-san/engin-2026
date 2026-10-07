import { createFileRoute } from "@tanstack/react-router";
import { ExploreHackathonsPage } from "~/features/explore/pages/ExploreHackathonsPage";

export const Route = createFileRoute("/_shell/explore/hackathons")({
	component: ExploreHackathonsPage,
});
