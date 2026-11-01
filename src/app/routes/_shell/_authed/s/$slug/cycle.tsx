import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { StartupCyclePage } from "~/pages/startup-cycle";

export const Route = createFileRoute("/_shell/_authed/s/$slug/cycle")({
	validateSearch: z.object({ card: z.string().optional() }),
	component: StartupCyclePage,
});
