import { createFileRoute } from "@tanstack/react-router";
import { ShellLayout } from "~/app/layouts/AuthLayouts";

export const Route = createFileRoute("/_shell")({
	component: ShellLayout,
});
