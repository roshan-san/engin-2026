import { createFileRoute } from "@tanstack/react-router";
import { ProfileEditorPage } from "~/features/people/profile/pages/ProfileEditorPage";

export const Route = createFileRoute("/_shell/_authed/profile/")({
	component: ProfileEditorPage,
});
