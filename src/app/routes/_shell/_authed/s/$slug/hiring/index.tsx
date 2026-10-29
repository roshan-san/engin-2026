import { createFileRoute } from "@tanstack/react-router";
import { HiringPage } from "~/pages/hiring";

export const Route = createFileRoute("/_shell/_authed/s/$slug/hiring/")({
	component: HiringPage,
});
