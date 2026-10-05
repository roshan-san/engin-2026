import { createFileRoute } from "@tanstack/react-router";
import { ThreadPage } from "~/features/hiring/threads/pages/ThreadPage";

export const Route = createFileRoute("/_shell/_authed/threads/$trialCycleId")({
	component: ThreadRoute,
});

function ThreadRoute() {
	const { trialCycleId } = Route.useParams();
	return <ThreadPage trialCycleId={trialCycleId} />;
}
