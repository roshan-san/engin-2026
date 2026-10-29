import { createFileRoute } from "@tanstack/react-router";
import { ParticipantBriefPage } from "~/pages/participant-brief";

export const Route = createFileRoute("/_shell/_authed/h/$id/brief")({
	component: ParticipantBriefPage,
});
