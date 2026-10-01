import { createDodoWebhookHandler } from "@dodopayments/convex";
import type { GenericActionCtx, GenericDataModel } from "convex/server";
import { httpRouter } from "convex/server";
import type { Infer } from "convex/values";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import type { subscriptionEvent } from "./billing/webhooks";

const http = httpRouter();

auth.addHttpRoutes(http);

type WebhookCtx = GenericActionCtx<GenericDataModel>;
type Metadata = Record<string, unknown> | undefined;
type SubscriptionPayload = {
	data: {
		subscription_id: string;
		customer?: { email?: string };
		metadata?: Record<string, unknown>;
		next_billing_date?: Date | string;
	};
};

function metadataString(metadata: Metadata, key: string): string | undefined {
	const value = metadata?.[key];
	return typeof value === "string" ? value : undefined;
}

/** Dodo parses dates into `Date`s; accept an ISO string as well. */
function toMillis(value: Date | string | undefined): number | undefined {
	return value === undefined ? undefined : new Date(value).getTime();
}

function onSubscription(event: Infer<typeof subscriptionEvent>) {
	return async (ctx: WebhookCtx, payload: SubscriptionPayload) => {
		await ctx.runMutation(internal.billing.webhooks.applySubscriptionEvent, {
			event,
			subscriptionId: payload.data.subscription_id,
			metadataUserId: metadataString(payload.data.metadata, "userId"),
			email: payload.data.customer?.email,
			nextBillingAt: toMillis(payload.data.next_billing_date),
		});
	};
}

http.route({
	path: "/dodopayments-webhook",
	method: "POST",
	handler: createDodoWebhookHandler({
		onPaymentSucceeded: async (ctx, payload) => {
			const metadata: Metadata = payload.data.metadata;
			await ctx.runMutation(internal.billing.webhooks.applyPaymentSucceeded, {
				paymentId: payload.data.payment_id,
				kind: metadataString(metadata, "kind"),
				trialCycleId: metadataString(metadata, "trialCycleId"),
				metadataUserId: metadataString(metadata, "userId"),
				email: payload.data.customer?.email,
			});
		},
		onSubscriptionActive: onSubscription("active"),
		onSubscriptionRenewed: onSubscription("renewed"),
		onSubscriptionOnHold: onSubscription("on_hold"),
		onSubscriptionCancelled: onSubscription("cancelled"),
		onSubscriptionFailed: onSubscription("failed"),
		onSubscriptionExpired: onSubscription("expired"),
	}),
});

export default http;
