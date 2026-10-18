import { type ObjectType, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_OPEN_HACKATHONS, MAX_USER_SUBSCRIPTIONS } from "../shared/limits";
import { PLANS, type PlanKey, type PlanView } from "../shared/plans";
import { subscriptionStatus } from "../shared/validators";
import { loadRunningHackathons } from "./hackathons";
import { loadFoundedStartups } from "./startups";

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
async function loadPlan(
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

/** Hackathons published since `since` across the Startups, counting up to `limit`. */
async function countPublishedSince(
	ctx: QueryCtx,
	startupIds: Id<"startups">[],
	since: number,
	limit: number,
): Promise<number> {
	let count = 0;
	for (const startupId of startupIds) {
		const published = await ctx.db
			.query("hackathons")
			.withIndex("by_startup_and_publishedAt", (q) =>
				q.eq("startupId", startupId).gte("publishedAt", since),
			)
			.take(limit - count);
		count += published.length;
		if (count >= limit) break;
	}
	return count;
}

/** Hackathons open, live or deciding across the Startups, counting up to the cap. */
async function countRunning(
	ctx: QueryCtx,
	startupIds: Id<"startups">[],
): Promise<number> {
	const running = await Promise.all(
		startupIds.map((startupId) =>
			loadRunningHackathons(ctx, startupId, MAX_OPEN_HACKATHONS),
		),
	);
	return Math.min(running.flat().length, MAX_OPEN_HACKATHONS);
}

/** The Founder's plan with what's left of it, or null without Pro. */
export async function loadPlanView(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<PlanView | null> {
	const plan = await loadPlan(ctx, userId);
	if (!plan) {
		return null;
	}
	const allowance = PLANS[plan.plan].hackathonsPerPeriod;
	const startupIds = (await loadFoundedStartups(ctx, userId)).map(
		(startup) => startup._id,
	);
	const published = await countPublishedSince(
		ctx,
		startupIds,
		plan.periodStart,
		allowance,
	);
	return {
		plan: plan.plan,
		periodEnd: plan.periodEnd,
		allowance,
		hackathonsLeft: allowance - published,
		running: await countRunning(ctx, startupIds),
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
