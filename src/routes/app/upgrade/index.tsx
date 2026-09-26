import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "~/features/pricing/ui/PricingPage";

export const Route = createFileRoute("/app/upgrade/")({
	component: PricingPage,
});
