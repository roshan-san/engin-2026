import { createFileRoute } from "@tanstack/react-router";
import { OnboardingFlow } from "~/features/startups/onboarding/OnboardingFlow";

export const Route = createFileRoute("/_shell/_authed/onboarding")({
	component: OnboardingFlow,
});
