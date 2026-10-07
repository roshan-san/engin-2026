import { createFileRoute } from "@tanstack/react-router";
import { ExploreStartupsPage } from "~/features/explore/pages/ExploreStartupsPage";

export const Route = createFileRoute("/_shell/explore/startups")({
	component: ExploreStartupsPage,
});
