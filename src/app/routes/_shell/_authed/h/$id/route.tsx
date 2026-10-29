import { createFileRoute } from "@tanstack/react-router";
import { ParticipantGate } from "~/app/layouts/ParticipantGate";

export const Route = createFileRoute("/_shell/_authed/h/$id")({
	component: ParticipantGate,
});
