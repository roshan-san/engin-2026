import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SpacePage } from "~/features/hiring/space/SpacePage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/hiring/$id")({
	validateSearch: z.object({
		view: z.string().optional(),
		card: z.string().optional(),
	}),
	component: SpacePage,
});
