import { createFileRoute } from "@tanstack/react-router";
import { AuthedLayout } from "~/shell/layout/AuthLayouts";

export const Route = createFileRoute("/_shell/_authed")({
	component: AuthedLayout,
});
