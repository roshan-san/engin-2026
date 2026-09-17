import { createFileRoute } from "@tanstack/react-router";
import { PitchPage } from "~/features/pitch/ui/PitchPage";

export const Route = createFileRoute("/app/pitch/")({
	component: PitchPage,
});
