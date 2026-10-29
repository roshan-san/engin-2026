import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { StartupBoardPage } from "~/pages/startup-board";

export const Route = createFileRoute("/_shell/_authed/s/$slug/board")({
	validateSearch: z.object({ card: z.string().optional() }),
	component: StartupBoardPage,
});
