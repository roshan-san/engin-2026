import { createFileRoute } from "@tanstack/react-router";
import { parseHackathonSearch } from "~/entities/hackathon";
import { ExploreHackathonsPage } from "~/pages/explore-hackathons";

export const Route = createFileRoute("/_shell/explore/hackathons")({
	validateSearch: parseHackathonSearch,
	component: ExploreHackathonsPage,
});
