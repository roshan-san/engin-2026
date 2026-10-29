import { createFileRoute } from "@tanstack/react-router";
import { parseStartupSearch } from "~/entities/startup";
import { ExploreStartups } from "~/features/explore/ExploreStartups";

export const Route = createFileRoute("/_shell/explore/startups")({
	validateSearch: parseStartupSearch,
	component: ExploreStartups,
});
