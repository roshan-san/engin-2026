import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageLoading } from "~/components/globals/PageLoading";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { PulseBoard } from "~/features/pulses/components/PulseBoard";
import { CloseTrialForm } from "~/features/trialCycles/components/CloseTrialForm";
import { MyVerdict } from "~/features/trialCycles/components/MyVerdict";
import { ParticipantTrialActions } from "~/features/trialCycles/components/ParticipantTrialActions";
import { TrialApplicants } from "~/features/trialCycles/components/TrialApplicants";
import { TrialChat } from "~/features/trialCycles/components/TrialChat";
import { formatDate } from "~/lib/dates";
import { toErrorMessage } from "~/lib/validation";

type TrialDetailPageProps = {
	readonly trialCycleId: string;
};

export function TrialDetailPage({ trialCycleId }: TrialDetailPageProps) {
	const id = trialCycleId as Id<"trialCycles">;
	const trial = useQuery(api.trialCycles.get, { trialCycleId: id });
	const cancel = useMutation(api.trialCycles.cancel);
	const [isPending, setIsPending] = useState(false);
	const [isClosing, setIsClosing] = useState(false);

	if (trial === undefined) {
		return <PageLoading />;
	}

	if (!trial) {
		return (
			<div className="py-16 text-center">
				<h1 className="text-2xl font-bold">Trial Cycle not found</h1>
				<Button asChild variant="outline" className="mt-6">
					<Link to="/app/opportunities">Back to Opportunities</Link>
				</Button>
			</div>
		);
	}

	const hasAccess = trial.isMember || trial.isParticipant;

	async function run(action: () => Promise<unknown>, fallback: string) {
		setIsPending(true);
		try {
			await action();
		} catch (error) {
			toast.error(toErrorMessage(error, fallback));
		} finally {
			setIsPending(false);
		}
	}

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8 py-8">
			<div className="space-y-3">
				<div className="flex flex-wrap gap-2">
					<Badge variant="secondary">{trial.status}</Badge>
					<Badge variant="outline">{trial.admission}</Badge>
				</div>
				<h1 className="text-2xl font-bold">{trial.title}</h1>
				<p className="text-muted-foreground">
					{trial.startupName} · {trial.roleTitle}
				</p>
				<p className="text-sm text-muted-foreground">
					{formatDate(trial.startsAt)} – {formatDate(trial.endsAt)} ·{" "}
					{trial.participantCount}/{trial.maxContributors} contributors
				</p>
				<p className="whitespace-pre-wrap leading-relaxed">
					{trial.description}
				</p>
				{trial.expectedOutcome ? (
					<p className="text-sm text-muted-foreground">
						Outcome: {trial.expectedOutcome}
					</p>
				) : null}
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline">
						<Link to="/startup/$slug" params={{ slug: trial.startupSlug }}>
							Startup page
						</Link>
					</Button>
					{trial.isFounder && trial.status === "active" ? (
						<Button
							type="button"
							variant="outline"
							disabled={isPending}
							onClick={() => setIsClosing(true)}
						>
							Close with Verdicts
						</Button>
					) : null}
					{trial.isFounder &&
					(trial.status === "open" || trial.status === "active") ? (
						<Button
							type="button"
							variant="ghost"
							disabled={isPending}
							onClick={() => {
								if (window.confirm("Cancel this Trial Cycle for everyone?")) {
									void run(
										() => cancel({ trialCycleId: id }),
										"Could not cancel Trial Cycle",
									);
								}
							}}
						>
							Cancel Trial Cycle
						</Button>
					) : null}
					{trial.isMember ? null : (
						<ParticipantTrialActions
							trialCycleId={id}
							trialStatus={trial.status}
							admission={trial.admission}
							myStatus={trial.myStatus}
							isPending={isPending}
							run={(action, fallback) => void run(action, fallback)}
						/>
					)}
				</div>
			</div>

			{isClosing ? (
				<CloseTrialForm
					trialCycleId={id}
					canOffer={trial.roleIsOpen}
					participants={trial.applicants
						.filter((applicant) => applicant.status === "joined")
						.map((applicant) => ({
							_id: applicant._id,
							name:
								applicant.user?.name ??
								applicant.user?.username ??
								"Participant",
						}))}
					onDone={() => setIsClosing(false)}
				/>
			) : null}
			{trial.myVerdict && trial.myApplicationId ? (
				<MyVerdict
					applicationId={trial.myApplicationId}
					verdict={trial.myVerdict}
					evaluation={trial.myEvaluation}
					isEvaluationPublic={trial.myEvaluationPublic}
					isPending={isPending}
					run={(action, fallback) => void run(action, fallback)}
				/>
			) : null}
			{hasAccess ? (
				<PulseBoard
					startupId={trial.startupId}
					trialCycleId={id}
					canCreate={trial.isMember}
				/>
			) : null}
			{trial.isMember ? (
				<TrialApplicants applicants={trial.applicants} />
			) : null}
			{hasAccess ? <TrialChat trialCycleId={id} /> : null}
		</div>
	);
}
