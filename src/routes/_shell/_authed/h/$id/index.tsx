import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ParticipantPage } from "~/features/hiring/participant/ParticipantPage";

export const Route = createFileRoute("/_shell/_authed/h/$id/")({
	validateSearch: z.object({
		card: z.string().optional(),
		panel: z.enum(["everyone", "founder"]).optional(),
	}),
	component: ParticipantPage,
});
