import { createFileRoute } from "@tanstack/react-router";
import { TrialsPage } from "~/features/trialCycles/ui/TrialsPage";

export const Route = createFileRoute("/app/trials/")({
	component: TrialsPage,
});
