import { createFileRoute } from "@tanstack/react-router";
import { PitchEditorPage } from "~/features/teams/startup/workspace/ui/PitchEditorPage";

export const Route = createFileRoute("/app/startup/")({
	component: PitchEditorPage,
});
