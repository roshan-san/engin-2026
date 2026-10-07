import type { Doc } from "@convex/_generated/dataModel";

type CheckoutHackathon = Pick<Doc<"hackathons">, "status" | "ipAcknowledgedAt">;

/**
 * A checkout was started for this unpublished hackathon and no credit has
 * landed yet. Only checkout stamps the IP acknowledgment on a draft (a
 * direct publish stamps it and opens the hackathon together). Once the paid
 * credit shows, the draft is waiting on the founder, not on Dodo.
 */
export function isConfirmingPayment(
	hackathon: CheckoutHackathon,
	creditCount: number | undefined,
): boolean {
	return (
		hackathon.status === "draft" &&
		hackathon.ipAcknowledgedAt !== undefined &&
		creditCount === 0
	);
}
