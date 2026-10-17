import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { HomePage } from "~/features/people/home/HomePage";

export const Route = createFileRoute("/_shell/_authed/home")({
	validateSearch: z.object({ intent: z.enum(["post"]).optional() }),
	component: HomePage,
});
