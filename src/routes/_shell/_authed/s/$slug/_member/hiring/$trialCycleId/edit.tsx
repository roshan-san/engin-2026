import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { HackathonFormPage } from "~/features/hiring/trialCycles/pages/HackathonFormPage";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/hiring/$trialCycleId/edit",
)({
	component: EditHackathonRoute,
});

function EditHackathonRoute() {
	const { trialCycleId } = Route.useParams();
	return (
		<HackathonFormPage
			mode="edit"
			trialCycleId={trialCycleId as Id<"trialCycles">}
		/>
	);
}
