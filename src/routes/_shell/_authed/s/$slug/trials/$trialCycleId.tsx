import { createFileRoute } from "@tanstack/react-router";
import { TrialCyclePage } from "~/features/hiring/trialCycles/pages/TrialCyclePage";

export const Route = createFileRoute("/_shell/_authed/s/$slug/trials/$trialCycleId")({
	component: TrialCycleRoute,
});

function TrialCycleRoute() {
	const { slug, trialCycleId } = Route.useParams();
	return <TrialCyclePage slug={slug} trialCycleId={trialCycleId} />;
}
