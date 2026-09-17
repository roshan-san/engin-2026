import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "~/features/team/ui/TeamPage";

export const Route = createFileRoute("/app/team/")({
	component: TeamPage,
});
