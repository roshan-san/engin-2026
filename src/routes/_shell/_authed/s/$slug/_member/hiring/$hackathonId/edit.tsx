import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { HackathonFormPage } from "~/features/hiring/hackathons/pages/HackathonFormPage";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/hiring/$hackathonId/edit",
)({
	component: EditHackathonRoute,
});

function EditHackathonRoute() {
	const { hackathonId } = Route.useParams();
	return (
		<HackathonFormPage
			mode="edit"
			hackathonId={hackathonId as Id<"hackathons">}
		/>
	);
}
