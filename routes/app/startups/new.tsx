import { createFileRoute } from "@tanstack/react-router";
import { CreateStartupPage } from "~/features/startups/ui/CreateStartupPage";

export const Route = createFileRoute("/app/startups/new")({
	component: CreateStartupPage,
});
