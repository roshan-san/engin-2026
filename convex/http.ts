import {
	createDodoWebhookHandler,
	type Subscription,
} from "@dodopayments/convex";
import {
	type GenericActionCtx,
	type GenericDataModel,
	httpRouter,
} from "convex/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/** Any subscription event: copy the subscription's current state in. */
async function syncFromDodo(
	ctx: GenericActionCtx<GenericDataModel>,
	payload: { timestamp: Date | string; data: Subscription },
) {
	const subscription = payload.data;
	const userId = subscription.metadata?.userId;
	await ctx.runMutation(internal.billing.subscriptions.sync, {
		dodoSubscriptionId: subscription.subscription_id,
		dodoCustomerId: subscription.customer.customer_id,
		productId: subscription.product_id,
		status: subscription.status,
		periodStart: new Date(subscription.previous_billing_date).getTime(),
		periodEnd: new Date(subscription.next_billing_date).getTime(),
		userId: typeof userId === "string" ? userId : undefined,
		eventAt: new Date(payload.timestamp).getTime(),
	});
}

http.route({
	path: "/dodopayments-webhook",
	method: "POST",
	// Verifies the signature with DODO_PAYMENTS_WEBHOOK_SECRET.
	handler: createDodoWebhookHandler({
		onSubscriptionActive: syncFromDodo,
		onSubscriptionRenewed: syncFromDodo,
		onSubscriptionOnHold: syncFromDodo,
		onSubscriptionPaused: syncFromDodo,
		onSubscriptionUnpaused: syncFromDodo,
		onSubscriptionCancelled: syncFromDodo,
		onSubscriptionFailed: syncFromDodo,
		onSubscriptionExpired: syncFromDodo,
		onSubscriptionPlanChanged: syncFromDodo,
		onSubscriptionUpdated: syncFromDodo,
	}),
});

export default http;
