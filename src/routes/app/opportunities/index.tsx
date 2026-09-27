import { createFileRoute } from "@tanstack/react-router";
import { OpportunitiesPage } from "~/features/hiring/opportunities/ui/OpportunitiesPage";

export const Route = createFileRoute("/app/opportunities/")({
	component: OpportunitiesPage,
});
