import { createFileRoute } from "@tanstack/react-router";
import { CreateSprintPage } from "~/features/sprints/ui/CreateSprintPage";

export const Route = createFileRoute("/app/sprints/new")({
	component: CreateSprintPage,
});
