import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { StartupCyclePage } from "~/pages/startup-cycle";

export const Route = createFileRoute("/_shell/_authed/s/$slug/cycle")({
	validateSearch: z.object({
		view: z.enum(["list", "board"]).optional(),
		card: z.string().optional(),
	}),
	component: StartupCyclePage,
});
