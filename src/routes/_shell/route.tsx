import { createFileRoute } from "@tanstack/react-router";
import { ShellLayout } from "~/shell/layout/AuthLayouts";

export const Route = createFileRoute("/_shell")({
	component: ShellLayout,
});
