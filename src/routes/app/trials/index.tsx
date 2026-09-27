import { createFileRoute } from "@tanstack/react-router";
import { TrialsPage } from "~/features/hiring/trialCycles/ui/TrialsPage";

export const Route = createFileRoute("/app/trials/")({
	component: TrialsPage,
});
