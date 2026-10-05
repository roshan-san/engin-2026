import { Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Badge } from "~/components/ui/badge";
import { entryStatusLabel } from "~/features/hiring/entries/constants";
import { CloseTrialForm } from "~/features/hiring/trialCycles/components/CloseTrialForm";
import { MyVerdict } from "~/features/hiring/trialCycles/components/MyVerdict";
import { ParticipantTrialActions } from "~/features/hiring/trialCycles/components/ParticipantTrialActions";
import { TrialAnnouncements } from "~/features/hiring/trialCycles/components/TrialAnnouncements";
import {
	applicantName,
	TrialApplicants,
} from "~/features/hiring/trialCycles/components/TrialApplicants";
import { TrialChallenges } from "~/features/hiring/trialCycles/components/TrialChallenges";
import { TrialHeader } from "~/features/hiring/trialCycles/components/TrialHeader";
import { useTrialCycle } from "~/features/hiring/trialCycles/hooks/useTrialCycle";
import { PulseBoard } from "~/features/work/pulses/components/PulseBoard";

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
	const [isClosing, setIsClosing] = useState(false);

	if (trial === undefined) {
		return <PageLoading rows={3} />;
	}

	if (
		trial === null ||
		trial.startupSlug !== slug ||
		(!trial.isMember && trial.myStatus === null)
	) {
		return <Navigate to="/startup/$slug" params={{ slug }} replace />;
	}

	const isLive =
		trial.status === "draft" ||
		trial.status === "open" ||
		trial.status === "active";
	const isPublishedLive = trial.status === "open" || trial.status === "active";
	const hasBoard =
		trial.myStatus === "joined" || trial.myStatus === "completed";
	const showsCloseForm =
		isClosing && trial.isFounder && trial.status === "active";

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8">
			<TrialHeader
				trial={trial}
				onClose={showsCloseForm ? undefined : () => setIsClosing(true)}
			/>
			{trial.status === "closed" && trial.myVerdict && trial.myApplicationId ? (
				<MyVerdict
					applicationId={trial.myApplicationId}
					verdict={trial.myVerdict}
					evaluation={trial.myEvaluation}
					isEvaluationPublic={trial.myEvaluationPublic}
					offer={trial.myOffer}
					startupName={trial.startupName}
					startupSlug={trial.startupSlug}
					roleTitle={trial.roleTitle}
				/>
			) : null}
			{showsCloseForm ? (
				<CloseTrialForm
					startupId={trial.startupId}
					trialCycleId={trial._id}
					trialTitle={trial.title}
					participants={trial.applicants
						.filter((applicant) => applicant.status === "joined")
						.map((applicant) => ({
							applicationId: applicant._id,
							userId: applicant.userId,
							name: applicantName(applicant),
						}))}
					canOffer={trial.roleIsOpen}
					onDone={() => setIsClosing(false)}
				/>
			) : trial.isMember ? (
				<>
					<TrialApplicants
						applicants={trial.applicants}
						startupId={trial.startupId}
						trialCycleId={trial._id}
						trialStatus={trial.status}
						isFounder={trial.isFounder}
					/>
					<TrialChallenges
						trialCycleId={trial._id}
						status={trial.status}
						canEdit={trial.isFounder && isLive}
					/>
					{trial.status !== "draft" ? (
						<TrialAnnouncements
							trialCycleId={trial._id}
							canPost={trial.isFounder && isPublishedLive}
						/>
					) : null}
				</>
			) : trial.myStatus ? (
				<>
					<section className="space-y-2">
						<h2 className="text-lg font-semibold">Your entry</h2>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">
								{entryStatusLabel(trial.myStatus, trial.status)}
							</Badge>
							<ParticipantTrialActions
								trialCycleId={trial._id}
								trialTitle={trial.title}
								trialStatus={trial.status}
								myStatus={trial.myStatus}
							/>
						</div>
					</section>
					{hasBoard ? (
						<>
							<TrialAnnouncements trialCycleId={trial._id} canPost={false} />
							<PulseBoard
								startupId={trial.startupId}
								trialCycleId={trial._id}
								hasStarted={trial.status !== "open"}
								isEditable={
									trial.status === "active" && trial.myStatus === "joined"
								}
							/>
						</>
					) : null}
				</>
			) : null}
		</div>
	);
}
