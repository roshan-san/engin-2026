import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

type PulseReviewControlsProps = {
	readonly pulseId: Id<"pulses">;
	readonly canReview: boolean;
	readonly isPending: boolean;
	readonly run: (action: () => Promise<unknown>) => void;
};

export function PulseReviewControls({
	pulseId,
	canReview,
	isPending,
	run,
}: PulseReviewControlsProps) {
	const verify = useMutation(api.pulses.verify);
	const reject = useMutation(api.pulses.reject);

	function sendBack() {
		const note = window.prompt("What needs to change?");
		if (!note?.trim()) {
			return;
		}
		run(() => reject({ pulseId, note }));
	}

	return (
		<>
			<Badge variant="secondary">In review</Badge>
			{canReview ? (
				<>
					<Button
						type="button"
						size="sm"
						disabled={isPending}
						onClick={() => run(() => verify({ pulseId }))}
					>
						Verify
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={isPending}
						onClick={sendBack}
					>
						Send back
					</Button>
				</>
			) : null}
		</>
	);
}
