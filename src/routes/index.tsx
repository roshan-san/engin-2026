import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "~/features/landing/ui/LandingPage";

export const Route = createFileRoute("/")({
	component: LandingPage,
});
