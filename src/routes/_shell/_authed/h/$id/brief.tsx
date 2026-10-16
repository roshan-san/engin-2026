import { createFileRoute } from "@tanstack/react-router";
import { BriefPage } from "~/features/hiring/participant/BriefPage";

export const Route = createFileRoute("/_shell/_authed/h/$id/brief")({
	component: BriefPage,
});
