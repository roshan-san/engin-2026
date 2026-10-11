import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "~/features/people/profile/ProfilePage";

export const Route = createFileRoute("/_shell/u/$username")({
	component: ProfilePage,
});
