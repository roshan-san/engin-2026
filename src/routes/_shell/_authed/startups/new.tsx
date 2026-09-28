import { createFileRoute } from "@tanstack/react-router";
import { CreateStartupPage } from "~/features/teams/startup/public/pages/CreateStartupPage";

export const Route = createFileRoute("/_shell/_authed/startups/new")({
	component: CreateStartupPage,
});
