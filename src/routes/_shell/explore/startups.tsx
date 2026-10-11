import { createFileRoute } from "@tanstack/react-router";
import { ExploreStartups } from "~/features/explore/ExploreStartups";
import { parseStartupSearch } from "~/features/explore/exploreSearch";

export const Route = createFileRoute("/_shell/explore/startups")({
	validateSearch: parseStartupSearch,
	component: ExploreStartups,
});
