import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { WorkspacePage } from "~/features/work/board/WorkspacePage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/board")({
	validateSearch: z.object({ card: z.string().optional() }),
	component: WorkspacePage,
});
