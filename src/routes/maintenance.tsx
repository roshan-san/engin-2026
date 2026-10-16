import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "~/shell/MaintenancePage";

export const Route = createFileRoute("/maintenance")({
	component: MaintenancePage,
});
