import { createFileRoute } from "@tanstack/react-router";
import { CreateRolePage } from "~/features/hiring/roles/ui/CreateRolePage";

export const Route = createFileRoute("/app/startup/roles/new")({
	component: CreateRolePage,
});
