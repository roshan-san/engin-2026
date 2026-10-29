import {
	type PlanView,
	publishBlockFor,
	publishBlockMessage,
} from "@convex/shared/plans";

export const PAYMENT_ISSUE =
	"Your last payment didn't go through. Update your card in Manage billing to publish.";

export type DraftPublish = {
	/** Shown above the form; null when there's nothing to say. */
	message: string | null;
	isDisabled: boolean;
	/** Publish opens the plans instead of publishing. */
	opensPlans: boolean;
	/** Show Manage billing beside the message. */
	managesBilling: boolean;
};

/** What Publish does on a draft, given your plan. `undefined` means still loading. */
export function draftPublish({
	plan,
	hasPaymentIssue,
	isBackFromCheckout,
}: {
	plan: PlanView | null | undefined;
	hasPaymentIssue: boolean | undefined;
	isBackFromCheckout: boolean;
}): DraftPublish {
	const state: DraftPublish = {
		message: null,
		isDisabled: false,
		opensPlans: false,
		managesBilling: false,
	};
	// While loading, Publish goes to the server, which checks the plan anyway.
	if (plan === undefined || hasPaymentIssue === undefined) {
		return state;
	}
	if (plan === null) {
		if (hasPaymentIssue) {
			return {
				...state,
				message: PAYMENT_ISSUE,
				isDisabled: true,
				managesBilling: true,
			};
		}
		// Just paid: the webhook is on its way, so don't offer checkout again.
		if (isBackFromCheckout) {
			return { ...state, isDisabled: true };
		}
		return { ...state, opensPlans: true };
	}
	const block = publishBlockFor(plan);
	return block
		? { ...state, message: publishBlockMessage(block), isDisabled: true }
		: state;
}
