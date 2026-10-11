import { createFileRoute } from "@tanstack/react-router";
import { PublicStartupPage } from "~/features/startups/public/PublicStartupPage";

export const Route = createFileRoute("/_shell/startups/$slug")({
	component: PublicStartupPage,
});
