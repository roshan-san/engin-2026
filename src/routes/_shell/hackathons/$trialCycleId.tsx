import { createFileRoute } from "@tanstack/react-router";
import { PublicHackathonPage } from "~/features/hiring/opportunities/pages/PublicHackathonPage";

export const Route = createFileRoute("/_shell/hackathons/$trialCycleId")({
	component: PublicHackathonRoute,
});

function PublicHackathonRoute() {
	const { trialCycleId } = Route.useParams();
	return <PublicHackathonPage trialCycleId={trialCycleId} />;
}
