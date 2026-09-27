import { createFileRoute } from "@tanstack/react-router";
import { CreateStartupPage } from "~/features/startup/public/ui/CreateStartupPage";

export const Route = createFileRoute("/app/startups/new")({
	component: CreateStartupPage,
});
