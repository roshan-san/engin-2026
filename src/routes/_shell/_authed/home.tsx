import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "~/features/people/home/HomePage";

export const Route = createFileRoute("/_shell/_authed/home")({
	component: HomePage,
});
