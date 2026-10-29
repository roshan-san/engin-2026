import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "~/app/layouts/PublicShell";
import { LandingPage } from "~/pages/landing";

export const Route = createFileRoute("/")({
	component: () => <LandingPage Shell={PublicShell} />,
});
