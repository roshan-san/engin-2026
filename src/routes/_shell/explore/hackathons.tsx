import { createFileRoute } from "@tanstack/react-router";
import { ExploreHackathons } from "~/features/explore/ExploreHackathons";
import { parseHackathonSearch } from "~/features/explore/exploreSearch";

export const Route = createFileRoute("/_shell/explore/hackathons")({
	validateSearch: parseHackathonSearch,
	component: ExploreHackathons,
});
