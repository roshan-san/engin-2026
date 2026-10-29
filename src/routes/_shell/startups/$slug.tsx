import { createFileRoute } from "@tanstack/react-router";
import { PublicStartupPage } from "~/pages/public-startup";

export const Route = createFileRoute("/_shell/startups/$slug")({
	component: PublicStartupPage,
});
