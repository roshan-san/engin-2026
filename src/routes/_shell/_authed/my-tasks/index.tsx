import { createFileRoute } from "@tanstack/react-router";
import { MyTasksPage } from "~/features/work/tasks/pages/MyTasksPage";

export const Route = createFileRoute("/_shell/_authed/my-tasks/")({
	component: MyTasksPage,
});
