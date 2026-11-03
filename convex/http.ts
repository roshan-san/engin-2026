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

const page = (status: number, body: string) =>
	new Response(
		`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>engin</title><div style="font-family:system-ui;padding:2rem;max-width:32rem">${body}</div>`,
		{ status, headers: { "Content-Type": "text/html; charset=utf-8" } },
	);

/**
 * The link at the foot of every email. Opening it only asks, because mail scanners
 * open links; the button (and one-click List-Unsubscribe) POSTs to unsubscribe.
 */
http.route({
	path: "/email/unsubscribe",
	method: "GET",
	handler: httpAction(async (_ctx, request) => {
		const token = new URL(request.url).searchParams.get("token") ?? "";
		return page(
			200,
			`<p>Stop all emails from engin to this address?</p><form method="post" action="?token=${encodeURIComponent(token)}"><button type="submit" style="font:inherit;padding:.5rem 1rem">Unsubscribe</button></form>`,
		);
	}),
});

http.route({
	path: "/email/unsubscribe",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const token = new URL(request.url).searchParams.get("token") ?? "";
		const done = token
			? await ctx.runMutation(internal.email.unsubscribe, { token })
			: false;
		return done
			? page(
					200,
					"<p>You're unsubscribed. engin won't email this address again.</p>",
				)
			: page(400, "<p>This unsubscribe link isn't valid.</p>");
	}),
});

export default http;
