import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	askForMessage,
	LEAVING_SCORE_PENALTY,
} from "~/features/hiring/trialCycles/constants";

type ParticipantTrialActionsProps = {
	readonly trialCycleId: Id<"trialCycles">;
	readonly trialStatus: string;
	readonly admission: "open" | "application";
	readonly myStatus: string | null;
	readonly isPending: boolean;
	readonly run: (action: () => Promise<unknown>, fallback: string) => void;
};

export function ParticipantTrialActions({
	trialCycleId,
	trialStatus,
	admission,
	myStatus,
	isPending,
	run,
}: ParticipantTrialActionsProps) {
	const applyToTrial = useMutation(api.hiring.applications.applyToTrial);
	const joinTrial = useMutation(api.hiring.applications.joinTrial);
	const leaveTrial = useMutation(api.hiring.applications.leaveTrial);

	if (!myStatus) {
		if (trialStatus !== "open") {
			return null;
		}
		const isOpenAdmission = admission === "open";
		return (
			<Button
				type="button"
				disabled={isPending}
				onClick={() =>
					run(
						() =>
							isOpenAdmission
								? joinTrial({ trialCycleId })
								: applyToTrial({ trialCycleId, message: askForMessage() }),
						isOpenAdmission ? "Could not join" : "Could not apply",
					)
				}
			>
				{isOpenAdmission ? "Join Trial Cycle" : "Apply"}
			</Button>
		);
	}

	const isLive = trialStatus === "open" || trialStatus === "active";
	const canExit = isLive && (myStatus === "applied" || myStatus === "joined");
	const isLeaving = myStatus === "joined" && trialStatus === "active";

	function exit() {
		if (
			isLeaving &&
			!window.confirm(
				`Leaving now costs ${LEAVING_SCORE_PENALTY} Score and shows on your profile. Leave anyway?`,
			)
		) {
			return;
		}
		run(() => leaveTrial({ trialCycleId }), "Could not leave");
	}

	return (
		<>
			<Badge variant="secondary">{myStatus}</Badge>
			{canExit ? (
				<Button
					type="button"
					variant="outline"
					disabled={isPending}
					onClick={exit}
				>
					{myStatus === "applied" ? "Withdraw" : "Leave"}
				</Button>
			) : null}
		</>
	);
}
