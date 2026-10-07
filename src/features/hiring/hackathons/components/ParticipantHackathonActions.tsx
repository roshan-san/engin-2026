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
import type { ApplicationStatus } from "~/features/hiring/myHackathons/constants";
import { useLeaveHackathon } from "~/features/hiring/myHackathons/hooks/useLeaveHackathon";
import {
	LEAVING_SCORE_PENALTY,
	type HackathonStatus,
} from "~/features/hiring/hackathons/constants";

type ParticipantHackathonActionsProps = {
	readonly hackathonId: Id<"hackathons">;
	readonly hackathonTitle: string;
	readonly hackathonStatus: HackathonStatus;
	readonly myStatus: ApplicationStatus;
};

/** An entrant's one way out: Withdraw before the start (free), Leave while it runs. */
export function ParticipantHackathonActions({
	hackathonId,
	hackathonTitle,
	hackathonStatus,
	myStatus,
}: ParticipantHackathonActionsProps) {
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const { leave, isPending } = useLeaveHackathon();

	const isIn = myStatus === "applied" || myStatus === "accepted";
	const isLive = hackathonStatus === "open" || hackathonStatus === "active";
	if (!isIn || !isLive) {
		return null;
	}
	const isLeaving = myStatus === "accepted" && hackathonStatus === "active";
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
							{action} “{hackathonTitle}”?
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
								if (await leave(hackathonId, isLeaving)) {
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
