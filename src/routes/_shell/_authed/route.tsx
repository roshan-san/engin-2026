import { createFileRoute } from "@tanstack/react-router";
import { AuthedLayout } from "~/shell/AuthLayouts";

export const Route = createFileRoute("/_shell/_authed")({
	component: AuthedLayout,
});
