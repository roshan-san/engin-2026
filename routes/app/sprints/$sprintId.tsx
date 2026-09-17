import { createFileRoute } from "@tanstack/react-router";
import { SprintDetailPage } from "~/features/sprints/ui/SprintDetailPage";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/app/sprints/$sprintId")({
	component: SprintDetailRoute,
});

function SprintDetailRoute() {
	const { sprintId } = Route.useParams();
	return (
		<SprintDetailPage sprintId={sprintId as Id<"hiringSprints">} />
	);
}
