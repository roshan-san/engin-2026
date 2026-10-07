import { createFileRoute } from "@tanstack/react-router";
import { ThreadsPage } from "~/features/hiring/threads/pages/ThreadsPage";

export const Route = createFileRoute("/_shell/_authed/threads/")({
	component: ThreadsPage,
});
