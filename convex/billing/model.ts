import { type ObjectType, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	MAX_USER_SUBSCRIPTIONS,
	PLANS,
	type PlanKey,
	type PlanView,
	subscriptionStatus,
} from "./rules";

async function loadSubscriptions(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<Doc<"subscriptions">[]> {
	return await ctx.db
		.query("subscriptions")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_SUBSCRIPTIONS);
}

/** The Founder's plan: their active subscription that runs longest, or null. */
export async function loadPlan(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<Doc<"subscriptions"> | null> {
	const subscriptions = await loadSubscriptions(ctx, userId);
	let plan: Doc<"subscriptions"> | null = null;
	for (const subscription of subscriptions) {
		if (
			subscription.status === "active" &&
			(!plan || subscription.periodEnd > plan.periodEnd)
		) {
			plan = subscription;
		}
	}
	return plan;
}

/**
 * True when the Founder has no active plan but one is on hold or paused: a
 * failed payment Dodo is still retrying. They fix the card instead of buying again.
 */
export async function hasPaymentIssue(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<boolean> {
	const subscriptions = await loadSubscriptions(ctx, userId);
	if (subscriptions.some((subscription) => subscription.status === "active")) {
		return false;
	}
	return subscriptions.some(
		(subscription) =>
			subscription.status === "on_hold" || subscription.status === "paused",
	);
}

/** Usage counted against a plan's allowance. */
export type PlanUsage = { published: number; running: number };

/** The plan with what is left of it, given the Hackathons published this period and running now. */
export function planViewFor(
	plan: NonNullable<Awaited<ReturnType<typeof loadPlan>>>,
	usage: PlanUsage,
): PlanView {
	const allowance = PLANS[plan.plan].hackathonsPerPeriod;
	return {
		plan: plan.plan,
		periodEnd: plan.periodEnd,
		allowance,
		hackathonsLeft: allowance - usage.published,
		running: usage.running,
	};
}

const PRODUCT_ENV: Record<PlanKey, string> = {
	monthly: "DODO_PRODUCT_MONTHLY",
	six_months: "DODO_PRODUCT_SIX_MONTHS",
	yearly: "DODO_PRODUCT_YEARLY",
};

/** The Dodo product a plan is sold as. Test and live mode have different ids, so they come from env. */
export function productIdFor(plan: PlanKey): string {
	const productId = process.env[PRODUCT_ENV[plan]];
	if (!productId) {
		throw new Error(`${PRODUCT_ENV[plan]} is not set`);
	}
	return productId;
}

export function planForProduct(productId: string): PlanKey | null {
	const plans = Object.keys(PRODUCT_ENV) as PlanKey[];
	return (
		plans.find((plan) => process.env[PRODUCT_ENV[plan]] === productId) ?? null
	);
}

/** One Dodo subscription event, flattened by the webhook. */
export const subscriptionEvent = {
	dodoSubscriptionId: v.string(),
	dodoCustomerId: v.string(),
	productId: v.string(),
	status: subscriptionStatus,
	periodStart: v.number(),
	periodEnd: v.number(),
	/** `metadata.userId`, set by checkout. */
	userId: v.optional(v.string()),
	/** When Dodo sent the event. */
	eventAt: v.number(),
};

type SubscriptionEvent = ObjectType<typeof subscriptionEvent>;

/**
 * Copies a Dodo subscription event in. Bad data is logged and dropped, never
 * thrown: a throw makes Dodo retry the same event forever.
 */
export async function syncSubscription(
	ctx: MutationCtx,
	event: SubscriptionEvent,
): Promise<void> {
	const plan = planForProduct(event.productId);
	if (!plan) {
		console.warn(
			`Dodo subscription ${event.dodoSubscriptionId}: unknown product ${event.productId}`,
		);
		return;
	}
	const userId = event.userId
		? ctx.db.normalizeId("users", event.userId)
		: null;
	if (!userId || !(await ctx.db.get(userId))) {
		console.warn(
			`Dodo subscription ${event.dodoSubscriptionId}: no engin user in metadata`,
		);
		return;
	}

	const existing = await ctx.db
		.query("subscriptions")
		.withIndex("by_dodo_subscription", (q) =>
			q.eq("dodoSubscriptionId", event.dodoSubscriptionId),
		)
		.unique();
	// Dodo can deliver out of order; an older event must not overwrite a newer one.
	if (existing && existing.syncedAt > event.eventAt) {
		return;
	}

	const fields = {
		userId,
		dodoSubscriptionId: event.dodoSubscriptionId,
		dodoCustomerId: event.dodoCustomerId,
		plan,
		status: event.status,
		periodStart: event.periodStart,
		periodEnd: event.periodEnd,
		syncedAt: event.eventAt,
	};
	if (existing) {
		await ctx.db.patch(existing._id, fields);
	} else {
		await ctx.db.insert("subscriptions", fields);
	}
}
