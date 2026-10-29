import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "~/pages/maintenance";

export const Route = createFileRoute("/maintenance")({
	component: MaintenancePage,
});
