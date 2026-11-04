import {
	type PlanView,
	publishBlockFor,
	publishBlockMessage,
} from "@convex/billing/rules";

export const PAYMENT_ISSUE =
	"Your last payment didn't go through. Update your card in Manage billing to publish.";

/** A Co-founder can't buy or fix the Founder's plan, only ask. */
export const FOUNDER_PLAN =
	"Publishing uses the Founder's Pro plan, which can't publish this now. Ask the Founder.";

export type DraftPublish = {
	/** Shown above the form; null when there's nothing to say. */
	message: string | null;
	isDisabled: boolean;
	/** Publish opens the plans instead of publishing. */
	opensPlans: boolean;
	/** Show Manage billing beside the message. */
	managesBilling: boolean;
};

/** What Publish does on a draft, given the Founder's plan. `undefined` means still loading. */
export function draftPublish({
	plan,
	hasPaymentIssue,
	isBackFromCheckout,
	isOwner,
}: {
	plan: PlanView | null | undefined;
	hasPaymentIssue: boolean | undefined;
	isBackFromCheckout: boolean;
	/** The Founder, whose plan it is; a Co-founder publishes on it. */
	isOwner: boolean;
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
	if (!isOwner) {
		return plan && !publishBlockFor(plan)
			? state
			: { ...state, message: FOUNDER_PLAN, isDisabled: true };
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
