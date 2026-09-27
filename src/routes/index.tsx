import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "~/features/marketing/landing/ui/LandingPage";

export const Route = createFileRoute("/")({
	component: LandingPage,
});
