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
	APPLICATION_STATUS_LABELS,
	type ApplicationStatus,
} from "~/features/hiring/myHackathons/constants";
import { useRespondToOffer } from "~/features/hiring/offers/hooks/useRespondToOffer";
import {
	OFFER_STATUS_LABELS,
	type OfferStatus,
	type HackathonStatus,
	type Verdict,
	verdictLabel,
} from "~/features/hiring/hackathons/constants";
import { useDecideApplication } from "~/features/hiring/hackathons/hooks/useDecideApplication";

type Applicant = {
	_id: Id<"applications">;
	userId: Id<"users">;
	status: ApplicationStatus;
	message?: string | null;
	verdict?: Verdict;
	offer: { _id: Id<"offers">; status: OfferStatus } | null;
	user: { name: string | null; username: string | null } | null;
};

type HackathonApplicantsProps = {
	readonly applicants: Applicant[];
	readonly hackathonStatus: HackathonStatus;
	readonly isFounder: boolean;
	/** Shows a Participant's lane on the board above; Founders, once it has started. */
	readonly onOpenLane?: (userId: Id<"users">) => void;
};

/** Whoever took part has a lane, including someone who left mid-hackathon. */
export function hasLane(status: ApplicationStatus): boolean {
	return status === "accepted" || status === "completed" || status === "left";
}

export function applicantName(applicant: Applicant): string {
	return applicant.user?.name ?? applicant.user?.username ?? "Participant";
}

export function HackathonApplicants({
	applicants,
	hackathonStatus,
	isFounder,
	onOpenLane,
}: HackathonApplicantsProps) {
	const { decide, pendingId } = useDecideApplication();
	const offers = useRespondToOffer();
	const [withdrawing, setWithdrawing] = useState<Applicant | null>(null);
	const canDecide = isFounder && hackathonStatus === "open";
	const canOpenLanes =
		isFounder && (hackathonStatus === "active" || hackathonStatus === "closed");

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
										: APPLICATION_STATUS_LABELS[applicant.status]}
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
								{onOpenLane && canOpenLanes && hasLane(applicant.status) ? (
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => onOpenLane(applicant.userId)}
									>
										Open lane
									</Button>
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
											onClick={() => void decide(applicant._id, "accepted")}
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
