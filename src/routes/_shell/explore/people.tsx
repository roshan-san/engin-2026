import { createFileRoute } from "@tanstack/react-router";
import { ExplorePeoplePage } from "~/features/explore/pages/ExplorePeoplePage";

export const Route = createFileRoute("/_shell/explore/people")({
	component: ExplorePeoplePage,
});
