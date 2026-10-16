import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import {
	MAX_OPEN_HACKATHONS,
	MAX_USER_STARTUPS,
	MAX_USER_SUBSCRIPTIONS,
} from "../shared/limits";
import {
	PLANS,
	type PlanView,
	type PublishBlock,
	publishBlockFor,
} from "../shared/plans";

const RUNNING = ["open", "building", "deciding"] as const;

/** The Founder's plan: their active subscription that runs longest, or null. */
export async function loadPlan(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<Doc<"subscriptions"> | null> {
	const subscriptions = await ctx.db
		.query("subscriptions")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_SUBSCRIPTIONS);
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

async function loadFoundedStartupIds(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<Id<"startups">[]> {
	const startups = await ctx.db
		.query("startups")
		.withIndex("by_founder", (q) => q.eq("founderId", userId))
		.take(MAX_USER_STARTUPS);
	return startups.map((startup) => startup._id);
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

/** Hackathons open, building or deciding across the Startups, counting up to the cap. */
async function countRunning(
	ctx: QueryCtx,
	startupIds: Id<"startups">[],
): Promise<number> {
	let count = 0;
	for (const startupId of startupIds) {
		for (const status of RUNNING) {
			const running = await ctx.db
				.query("hackathons")
				.withIndex("by_startup_and_status", (q) =>
					q.eq("startupId", startupId).eq("status", status),
				)
				.take(MAX_OPEN_HACKATHONS - count);
			count += running.length;
			if (count >= MAX_OPEN_HACKATHONS) return count;
		}
	}
	return count;
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
	const startupIds = await loadFoundedStartupIds(ctx, userId);
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

/** Why this Founder can't publish now, or null when they can. */
export async function canPublishHackathon(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<PublishBlock | null> {
	return publishBlockFor(await loadPlanView(ctx, userId));
}
