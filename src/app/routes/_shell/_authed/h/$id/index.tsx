import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ParticipantBoardPage } from "~/pages/participant-board";

export const Route = createFileRoute("/_shell/_authed/h/$id/")({
	validateSearch: z.object({
		card: z.string().optional(),
		panel: z.enum(["everyone", "founder"]).optional(),
	}),
	component: ParticipantBoardPage,
});
