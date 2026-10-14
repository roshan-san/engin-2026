import { createFileRoute } from "@tanstack/react-router";
import { BriefPage } from "~/features/hiring/builder/BriefPage";

export const Route = createFileRoute("/_shell/_authed/h/$id/brief")({
	component: BriefPage,
});
