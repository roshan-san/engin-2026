import { createFileRoute } from "@tanstack/react-router";
import { parseHackathonSearch } from "~/entities/hackathon";
import { ExploreHackathons } from "~/features/explore/ExploreHackathons";

export const Route = createFileRoute("/_shell/explore/hackathons")({
	validateSearch: parseHackathonSearch,
	component: ExploreHackathons,
});
