import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "~/features/marketing/pricing/ui/PricingPage";

export const Route = createFileRoute("/_shell/pricing/")({
	component: PricingPage,
});
