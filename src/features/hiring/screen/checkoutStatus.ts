import type { Doc } from "@convex/_generated/dataModel";

type CheckoutTrial = Pick<Doc<"trialCycles">, "status" | "ipAcknowledgedAt">;

/**
 * A checkout was started for this unpublished hackathon and no credit has
 * landed yet. Only checkout stamps the IP acknowledgment on a draft (a
 * direct publish stamps it and opens the trial together). Once the paid
 * credit shows, the draft is waiting on the founder, not on Dodo.
 */
export function isConfirmingPayment(
	trial: CheckoutTrial,
	creditCount: number | undefined,
): boolean {
	return (
		trial.status === "draft" &&
		trial.ipAcknowledgedAt !== undefined &&
		creditCount === 0
	);
}
