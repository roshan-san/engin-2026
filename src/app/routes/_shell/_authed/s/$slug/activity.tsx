import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { StartupActivityPage } from "~/pages/startup-activity";

export const Route = createFileRoute("/_shell/_authed/s/$slug/activity")({
	validateSearch: z.object({ entry: z.string().optional() }),
	component: StartupActivityPage,
});
