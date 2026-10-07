import { createFileRoute } from "@tanstack/react-router";
import { ThreadPage } from "~/features/hiring/threads/pages/ThreadPage";

export const Route = createFileRoute("/_shell/_authed/threads/$hackathonId")({
	component: ThreadRoute,
});

function ThreadRoute() {
	const { hackathonId } = Route.useParams();
	return <ThreadPage hackathonId={hackathonId} />;
}
