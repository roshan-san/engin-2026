import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	askForMessage,
	confirmIpTerms,
} from "~/features/hiring/trialCycles/constants";
import { toErrorMessage } from "~/lib/validation";

type ApplyButtonsProps = {
	readonly trialCycleId: Id<"trialCycles">;
	readonly admission?: "open" | "application";
};

export function ApplyButtons({ trialCycleId, admission }: ApplyButtonsProps) {
	const applyToTrial = useMutation(api.hiring.applications.applyToTrial);
	const joinTrial = useMutation(api.hiring.applications.joinTrial);
	const [isPending, setIsPending] = useState(false);

	async function run(action: () => Promise<unknown>, success: string) {
		setIsPending(true);
		try {
			await action();
			toast.success(success);
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not continue"));
		} finally {
			setIsPending(false);
		}
	}

	if (admission === "open") {
		return (
			<Button
				type="button"
				size="sm"
				disabled={isPending}
				onClick={() => {
					if (!confirmIpTerms()) {
						return;
					}
					void run(
						() => joinTrial({ trialCycleId, acceptTerms: true }),
						"Joined Trial Cycle",
					);
				}}
			>
				Join
			</Button>
		);
	}

	return (
		<Button
			type="button"
			size="sm"
			disabled={isPending}
			onClick={() => {
				if (!confirmIpTerms()) {
					return;
				}
				void run(
					() =>
						applyToTrial({
							trialCycleId,
							message: askForMessage(),
							acceptTerms: true,
						}),
					"Applied to Trial Cycle",
				);
			}}
		>
			Apply
		</Button>
	);
}
