import { createFileRoute } from "@tanstack/react-router";
import { HiringPage } from "~/features/hiring/list/HiringPage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/hiring/")({
	component: HiringPage,
});
