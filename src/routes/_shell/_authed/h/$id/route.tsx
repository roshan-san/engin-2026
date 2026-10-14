import { createFileRoute } from "@tanstack/react-router";
import { BuilderGate } from "~/features/hiring/builder/BuilderGate";

export const Route = createFileRoute("/_shell/_authed/h/$id")({
	component: BuilderGate,
});
