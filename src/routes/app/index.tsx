import { createFileRoute } from "@tanstack/react-router";
import { CyclePage } from "~/features/cycles/ui/CyclePage";

export const Route = createFileRoute("/app/")({
	component: CyclePage,
});
