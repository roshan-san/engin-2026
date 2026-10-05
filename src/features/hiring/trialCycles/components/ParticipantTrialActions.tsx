import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
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
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import type { EntryStatus } from "~/features/hiring/entries/constants";
import { useLeaveTrial } from "~/features/hiring/entries/hooks/useLeaveTrial";
import {
	LEAVING_SCORE_PENALTY,
	type TrialStatus,
} from "~/features/hiring/trialCycles/constants";

type ParticipantTrialActionsProps = {
	readonly trialCycleId: Id<"trialCycles">;
	readonly trialTitle: string;
	readonly trialStatus: TrialStatus;
	readonly myStatus: EntryStatus;
};

/** An entrant's one way out: Withdraw before the start (free), Leave while it runs. */
export function ParticipantTrialActions({
	trialCycleId,
	trialTitle,
	trialStatus,
	myStatus,
}: ParticipantTrialActionsProps) {
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const { leave, isPending } = useLeaveTrial();

	const isIn = myStatus === "applied" || myStatus === "joined";
	const isLive = trialStatus === "open" || trialStatus === "active";
	if (!isIn || !isLive) {
		return null;
	}
	const isLeaving = myStatus === "joined" && trialStatus === "active";
	const action = isLeaving ? "Leave" : "Withdraw";

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={isPending}
				onClick={() => setIsConfirmOpen(true)}
			>
				{action}
			</Button>
			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{action} “{trialTitle}”?
						</AlertDialogTitle>
						<AlertDialogDescription>
							{isLeaving
								? `Leaving costs ${LEAVING_SCORE_PENALTY} Score and shows on your profile. You lose your Board and can't rejoin.`
								: "You can't apply to this hackathon again. Withdrawing before the start costs nothing."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Stay in</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={isPending}
							onClick={async (event) => {
								event.preventDefault();
								if (await leave(trialCycleId, isLeaving)) {
									setIsConfirmOpen(false);
								}
							}}
						>
							{isPending ? <Spinner /> : null}
							{action}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
