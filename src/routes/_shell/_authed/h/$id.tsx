import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BuilderPage } from "~/features/hiring/builder/BuilderPage";

export const Route = createFileRoute("/_shell/_authed/h/$id")({
	validateSearch: z.object({
		card: z.string().optional(),
		thread: z.enum(["everyone", "founder"]).optional(),
	}),
	component: BuilderPage,
});
