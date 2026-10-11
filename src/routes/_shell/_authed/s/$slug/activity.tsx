import { createFileRoute } from "@tanstack/react-router";
import { ActivityPage } from "~/features/work/activity/ActivityPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/activity")({
	component: ActivityPage,
});
