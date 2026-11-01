import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OnboardingPage } from "~/pages/onboarding";

export const Route = createFileRoute("/_shell/_authed/onboarding")({
	validateSearch: z.object({ intent: z.enum(["post"]).optional() }),
	component: OnboardingPage,
});
