import { createFileRoute } from "@tanstack/react-router";
import { PitchPage } from "~/features/teams/startup/workspace/pages/PitchPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member/pitch/")({
	component: PitchPage,
});
