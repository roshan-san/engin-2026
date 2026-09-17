import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "~/features/dashboard/ui/DashboardPage";

export const Route = createFileRoute("/app/dashboard/")({
	component: DashboardPage,
});
