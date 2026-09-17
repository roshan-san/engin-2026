import { createFileRoute } from "@tanstack/react-router";
import { StartupPage } from "~/features/startup/ui/StartupPage";

export const Route = createFileRoute("/app/startup/")({
	component: StartupPage,
});
