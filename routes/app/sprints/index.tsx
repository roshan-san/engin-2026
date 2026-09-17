import { createFileRoute } from "@tanstack/react-router";
import { SprintsPage } from "~/features/sprints/ui/SprintsPage";

export const Route = createFileRoute("/app/sprints/")({
	component: SprintsPage,
});
