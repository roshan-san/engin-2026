import { createFileRoute } from "@tanstack/react-router";
import { CreateTrialPage } from "~/features/hiring/trialCycles/ui/CreateTrialPage";

export const Route = createFileRoute("/app/startup/trials/new")({
	component: CreateTrialPage,
});
