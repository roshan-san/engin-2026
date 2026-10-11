import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ActivityPage } from "~/features/work/activity/ActivityPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/activity")({
	validateSearch: z.object({ entry: z.string().optional() }),
	component: ActivityPage,
});
