import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * The signed-in founder's spendable hackathon credits. Members never see
 * credits, so pass `false` to skip the query for them.
 */
export function useCredits(enabled: boolean) {
	const balance = useQuery(api.billing.credits.balance, enabled ? {} : "skip");
	const credits = balance?.credits ?? [];

	return {
		count: balance?.available,
		/** The only credit left is the free one from signup. */
		onlyFreeCredit: credits.length === 1 && credits[0]?.source === "signup",
		hasSignupCredit: credits.some((credit) => credit.source === "signup"),
		isLoading: enabled && balance === undefined,
	};
}
