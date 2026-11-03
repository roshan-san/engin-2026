import { createFileRoute } from "@tanstack/react-router";
import { parsePeopleSearch } from "~/entities/person";
import { ExplorePeoplePage } from "~/pages/explore-people";

export const Route = createFileRoute("/_shell/explore/people")({
	validateSearch: parsePeopleSearch,
	component: ExplorePeoplePage,
});
