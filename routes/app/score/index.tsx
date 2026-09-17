import { createFileRoute } from "@tanstack/react-router";
import { ScorePage } from "~/features/score/ui/ScorePage";

export const Route = createFileRoute("/app/score/")({
	component: ScorePage,
});
