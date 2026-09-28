import { Navigate } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { StubScreen } from "~/components/shared/StubScreen";
import { useTrialCycle } from "~/features/hiring/trialCycles/hooks/useTrialCycle";

type TrialCyclePageProps = {
	readonly slug: string;
	readonly trialCycleId: string;
};

/**
 * The Trial Cycle screen is exempt from the blanket member gate — access is
 * decided by the existing api.hiring.trialCycles.get rule, which lets
 * Participants and Applicants who are not Members through.
 */
export function TrialCyclePage({ slug, trialCycleId }: TrialCyclePageProps) {
	const { trial } = useTrialCycle(trialCycleId);

	if (trial === undefined) {
		return <PageLoading rows={3} />;
	}

	if (trial === null || trial.startupSlug !== slug) {
		return <Navigate to="/startup/$slug" params={{ slug }} replace />;
	}

	return (
		<StubScreen
			title="Trial Cycle"
			emptyTitle="Board coming soon"
			emptyDescription="This Trial Cycle's Challenges and Participants will show up here."
		/>
	);
}
