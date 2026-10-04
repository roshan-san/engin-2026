import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	askForMessage,
	confirmIpTerms,
	LEAVING_SCORE_PENALTY,
} from "~/features/hiring/trialCycles/constants";

type ParticipantTrialActionsProps = {
	readonly trialCycleId: Id<"trialCycles">;
	readonly trialStatus: string;
	readonly myStatus: string | null;
	readonly isPending: boolean;
	readonly run: (action: () => Promise<unknown>, fallback: string) => void;
};

export function ParticipantTrialActions({
	trialCycleId,
	trialStatus,
	myStatus,
	isPending,
	run,
}: ParticipantTrialActionsProps) {
	const applyToTrial = useMutation(api.hiring.applications.applyToTrial);
	const leaveTrial = useMutation(api.hiring.applications.leaveTrial);

	if (!myStatus) {
		if (trialStatus !== "open") {
			return null;
		}
		return (
			<Button
				type="button"
				disabled={isPending}
				onClick={() => {
					if (!confirmIpTerms()) {
						return;
					}
					run(
						() =>
							applyToTrial({
								trialCycleId,
								message: askForMessage(),
								acceptTerms: true,
							}),
						"Could not apply",
					);
				}}
			>
				Apply
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
