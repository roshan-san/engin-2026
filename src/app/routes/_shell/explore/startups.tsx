import { createFileRoute } from "@tanstack/react-router";
import { parseStartupSearch } from "~/entities/startup";
import { ExploreStartupsPage } from "~/pages/explore-startups";

export const Route = createFileRoute("/_shell/explore/startups")({
	validateSearch: parseStartupSearch,
	component: ExploreStartupsPage,
});
