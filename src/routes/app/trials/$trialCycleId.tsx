import { createFileRoute } from "@tanstack/react-router";
import { TrialDetailPage } from "~/features/hiring/trialCycles/ui/TrialDetailPage";

export const Route = createFileRoute("/app/trials/$trialCycleId")({
	component: TrialDetailRoute,
});

function TrialDetailRoute() {
	const { trialCycleId } = Route.useParams();
	return <TrialDetailPage trialCycleId={trialCycleId} />;
}
