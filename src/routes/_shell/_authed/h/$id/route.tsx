import { createFileRoute } from "@tanstack/react-router";
import { ParticipantGate } from "~/features/hiring/participant/ParticipantGate";

export const Route = createFileRoute("/_shell/_authed/h/$id")({
	component: ParticipantGate,
});
