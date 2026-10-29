import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "~/pages/landing";
import { PublicShell } from "~/shell/PublicShell";

export const Route = createFileRoute("/")({
	component: () => <LandingPage Shell={PublicShell} />,
});
