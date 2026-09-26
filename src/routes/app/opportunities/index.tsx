import { createFileRoute } from "@tanstack/react-router";
import { OpportunitiesPage } from "~/features/opportunities/ui/OpportunitiesPage";

export const Route = createFileRoute("/app/opportunities/")({
	component: OpportunitiesPage,
});
