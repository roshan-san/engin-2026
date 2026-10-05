import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyState } from "~/components/shared/EmptyState";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	ENTRY_STATUS_LABELS,
	type EntryStatus,
} from "~/features/hiring/entries/constants";
import { useRespondToOffer } from "~/features/hiring/offers/hooks/useRespondToOffer";
import { ParticipantBoardSheet } from "~/features/hiring/trialCycles/components/ParticipantBoardSheet";
import {
	OFFER_STATUS_LABELS,
	type OfferStatus,
	type TrialStatus,
	type Verdict,
	verdictLabel,
} from "~/features/hiring/trialCycles/constants";
import { useDecideApplication } from "~/features/hiring/trialCycles/hooks/useDecideApplication";

type Applicant = {
	_id: Id<"applications">;
	userId: Id<"users">;
	status: EntryStatus;
	message?: string | null;
	verdict?: Verdict;
	offer: { _id: Id<"offers">; status: OfferStatus } | null;
	user: { name: string | null; username: string | null } | null;
};

type TrialApplicantsProps = {
	readonly applicants: Applicant[];
	readonly startupId: Id<"startups">;
	readonly trialCycleId: Id<"trialCycles">;
	readonly trialStatus: TrialStatus;
	readonly isFounder: boolean;
};

export function applicantName(applicant: Applicant): string {
	return applicant.user?.name ?? applicant.user?.username ?? "Participant";
}

export function TrialApplicants({
	applicants,
	startupId,
	trialCycleId,
	trialStatus,
	isFounder,
}: TrialApplicantsProps) {
	const { decide, pendingId } = useDecideApplication();
	const offers = useRespondToOffer();
	const [withdrawing, setWithdrawing] = useState<Applicant | null>(null);
	const canDecide = isFounder && trialStatus === "open";
	const canReadBoards =
		isFounder && (trialStatus === "active" || trialStatus === "closed");

	async function withdraw() {
		if (withdrawing?.offer && (await offers.withdraw(withdrawing.offer._id))) {
			setWithdrawing(null);
		}
	}

	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">Applicants</h2>
			{applicants.length === 0 ? (
				<EmptyState
					title="No applicants yet"
					description="People who apply to this hackathon will appear here."
				/>
			) : (
				<ul className="space-y-2">
					{applicants.map((applicant) => (
						<li
							key={applicant._id}
							className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
						>
							<div className="min-w-0 flex-1">
								{applicant.user?.username ? (
									<Link
										to="/u/$username"
										params={{ username: applicant.user.username }}
										className="font-medium break-words hover:underline"
									>
										{applicantName(applicant)}
									</Link>
								) : (
									<p className="font-medium break-words">
										{applicantName(applicant)}
									</p>
								)}
								{applicant.message ? (
									<p className="mt-1 whitespace-pre-wrap text-sm break-words text-muted-foreground">
										{applicant.message}
									</p>
								) : null}
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary">
									{applicant.verdict
										? verdictLabel(applicant.verdict)
										: ENTRY_STATUS_LABELS[applicant.status]}
								</Badge>
								{applicant.offer ? (
									<Badge
										variant={
											applicant.offer.status === "accepted"
												? "default"
												: "outline"
										}
									>
										{OFFER_STATUS_LABELS[applicant.offer.status]}
									</Badge>
								) : null}
								{canReadBoards &&
								(applicant.status === "joined" ||
									applicant.status === "completed") ? (
									<ParticipantBoardSheet
										startupId={startupId}
										trialCycleId={trialCycleId}
										participant={{
											userId: applicant.userId,
											name: applicantName(applicant),
										}}
									/>
								) : null}
								{isFounder && applicant.offer?.status === "pending" ? (
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={offers.pendingId !== null}
										onClick={() => setWithdrawing(applicant)}
									>
										Withdraw offer
									</Button>
								) : null}
								{canDecide && applicant.status === "applied" ? (
									<>
										<Button
											type="button"
											size="sm"
											disabled={pendingId !== null}
											onClick={() => void decide(applicant._id, "joined")}
										>
											Accept
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outline"
											disabled={pendingId !== null}
											onClick={() => void decide(applicant._id, "rejected")}
										>
											Reject
										</Button>
									</>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}

			<AlertDialog
				open={withdrawing !== null}
				onOpenChange={(open) => {
					if (!open) {
						setWithdrawing(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Withdraw the offer to{" "}
							{withdrawing ? applicantName(withdrawing) : ""}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							They can no longer accept it, and they are told it was withdrawn.
							Their Verdict stays.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={offers.pendingId !== null}>
							Keep the offer
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={offers.pendingId !== null}
							onClick={(event) => {
								event.preventDefault();
								void withdraw();
							}}
						>
							Withdraw offer
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
