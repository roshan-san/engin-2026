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
import { httpAction } from "./_generated/server";
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
	await ctx.runMutation(internal.billing.sync, {
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

/** The link at the foot of every email. GET, so it works from any mail app. */
http.route({
	path: "/email/unsubscribe",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		const token = new URL(request.url).searchParams.get("token") ?? "";
		const done = token
			? await ctx.runMutation(internal.email.unsubscribe, { token })
			: false;
		const message = done
			? "You're unsubscribed. engin won't email this address again."
			: "This unsubscribe link isn't valid.";
		return new Response(
			`<!doctype html><meta charset="utf-8"><title>engin</title><p style="font-family:system-ui;padding:2rem">${message}</p>`,
			{
				status: done ? 200 : 400,
				headers: { "Content-Type": "text/html; charset=utf-8" },
			},
		);
	}),
});

export default http;
