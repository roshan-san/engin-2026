import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Whether your plan is on hold after a failed payment; undefined while loading. */
export function usePaymentIssue() {
	return useQuery(api.billing.paymentIssue);
}
