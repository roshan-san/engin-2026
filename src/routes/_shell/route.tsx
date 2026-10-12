import { createFileRoute } from "@tanstack/react-router";
import { ShellLayout } from "~/shell/AuthLayouts";

export const Route = createFileRoute("/_shell")({
	component: ShellLayout,
});
