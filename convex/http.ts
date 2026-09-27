import { createDodoWebhookHandler } from "@dodopayments/convex";
import type { GenericActionCtx, GenericDataModel } from "convex/server";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

type WebhookCtx = GenericActionCtx<GenericDataModel>;

async function setPlanFromWebhook(
	ctx: WebhookCtx,
	payload: {
		data: {
			customer: { email: string };
			metadata?: Record<string, string>;
		};
	},
	planTier: "free" | "pro",
) {
	let userId = payload.data.metadata?.userId as Id<"users"> | undefined;

	if (!userId && payload.data.customer?.email) {
		const user = await ctx.runQuery(internal.people.users.getByEmail, {
			email: payload.data.customer.email,
		});
		userId = user?._id;
	}

	if (!userId) {
		return;
	}

	await ctx.runMutation(internal.people.billing.setPlanTier, {
		userId,
		planTier,
	});
}

http.route({
	path: "/dodopayments-webhook",
	method: "POST",
	handler: createDodoWebhookHandler({
		onSubscriptionActive: async (ctx, payload) => {
			await setPlanFromWebhook(ctx, payload, "pro");
		},
		onSubscriptionRenewed: async (ctx, payload) => {
			await setPlanFromWebhook(ctx, payload, "pro");
		},
		onSubscriptionOnHold: async (ctx, payload) => {
			await setPlanFromWebhook(ctx, payload, "free");
		},
		onSubscriptionCancelled: async (ctx, payload) => {
			await setPlanFromWebhook(ctx, payload, "free");
		},
		onSubscriptionFailed: async (ctx, payload) => {
			await setPlanFromWebhook(ctx, payload, "free");
		},
		onSubscriptionExpired: async (ctx, payload) => {
			await setPlanFromWebhook(ctx, payload, "free");
		},
	}),
});

export default http;
