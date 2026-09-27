import { createFileRoute } from "@tanstack/react-router";
import { EditProfilePage } from "~/features/people/profile/ui/EditProfilePage";

export const Route = createFileRoute("/app/profile/")({
	component: EditProfilePage,
});
