import { createFileRoute } from "@tanstack/react-router";
import { HackathonFormPage } from "~/features/hiring/hackathons/pages/HackathonFormPage";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/hiring/new",
)({
	component: () => <HackathonFormPage mode="create" />,
});
