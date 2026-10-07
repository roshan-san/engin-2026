import { createFileRoute } from "@tanstack/react-router";
import { PublicHackathonPage } from "~/features/hiring/opportunities/pages/PublicHackathonPage";

export const Route = createFileRoute("/_shell/hackathons/$hackathonId")({
	component: PublicHackathonRoute,
});

function PublicHackathonRoute() {
	const { hackathonId } = Route.useParams();
	return <PublicHackathonPage hackathonId={hackathonId} />;
}
