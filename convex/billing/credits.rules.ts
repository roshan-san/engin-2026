import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_USER_CREDITS, PRO_MONTHLY_CREDITS } from "../lib/limits";
import type { creditSource } from "../schema";

type CreditCtx = QueryCtx | MutationCtx;

type CreditSource = Infer<typeof creditSource>;

function isSpendable(credit: Doc<"hackathonCredits">, now: number): boolean {
	return (
		credit.spentAt === undefined &&
		(credit.expiresAt === undefined || credit.expiresAt > now)
	);
}

export async function listSpendableCredits(
	ctx: CreditCtx,
	ownerUserId: Id<"users">,
	now: number,
): Promise<Doc<"hackathonCredits">[]> {
	const unspent = await ctx.db
		.query("hackathonCredits")
		.withIndex("by_owner_and_spent", (q) =>
			q.eq("ownerUserId", ownerUserId).eq("spentAt", undefined),
		)
		.take(MAX_USER_CREDITS);
	return unspent.filter((credit) => isSpendable(credit, now));
}

/**
 * A publish spends the first of these it finds: this month's Pro credits
 * (they lapse soonest), then expiring re-runs, then the free signup credit,
 * so "uses your free credit" stays true.
 */
const CREDIT_SPEND_ORDER: readonly CreditSource[] = [
	"pro_monthly",
	"rerun",
	"signup",
	"purchase",
];

export const NO_CREDIT_MESSAGE =
	"You have no hackathon credits. Pay for this hackathon to publish it.";

/** Spend order first, then the soonest expiry, then the oldest. */
function compareForSpending(
	a: Doc<"hackathonCredits">,
	b: Doc<"hackathonCredits">,
): number {
	const bySource =
		CREDIT_SPEND_ORDER.indexOf(a.source) - CREDIT_SPEND_ORDER.indexOf(b.source);
	if (bySource !== 0) {
		return bySource;
	}
	const aExpiry = a.expiresAt ?? Number.MAX_SAFE_INTEGER;
	const bExpiry = b.expiresAt ?? Number.MAX_SAFE_INTEGER;
	if (aExpiry !== bExpiry) {
		return aExpiry - bExpiry;
	}
	return a._creationTime - b._creationTime;
}

export async function spendCredit(
	ctx: MutationCtx,
	ownerUserId: Id<"users">,
	_trialCycleId: Id<"trialCycles">,
	now: number,
): Promise<Doc<"hackathonCredits">> {
	const credits = await listSpendableCredits(ctx, ownerUserId, now);
	const credit = credits.sort(compareForSpending)[0];
	if (!credit) {
		throw new Error(NO_CREDIT_MESSAGE);
	}
	await ctx.db.patch(credit._id, {
		spentAt: now,
	});
	return credit;
}

type CreditGrant = {
	ownerUserId: Id<"users">;
	source: CreditSource;
	grantKey: string;
	expiresAt?: number;
};

/**
 * Inserts the credit unless its grant key was used before, because webhooks
 * repeat (eng review R1, R4). Returns null for a repeat.
 */
export async function grantCredit(
	ctx: MutationCtx,
	grant: CreditGrant,
): Promise<Id<"hackathonCredits"> | null> {
	const existing = await ctx.db
		.query("hackathonCredits")
		.withIndex("by_grant_key", (q) => q.eq("grantKey", grant.grantKey))
		.first();
	if (existing) {
		return null;
	}
	return await ctx.db.insert("hackathonCredits", grant);
}

/** Marks a one-time Dodo payment as a hackathon purchase (checkout metadata `kind`). */
export const HACKATHON_PAYMENT_KIND = "hackathon";

/** Every new account's first hackathon is free: one credit that never expires. */
export async function grantSignupCredit(
	ctx: MutationCtx,
	userId: Id<"users">,
): Promise<Id<"hackathonCredits"> | null> {
	return await grantCredit(ctx, {
		ownerUserId: userId,
		source: "signup",
		grantKey: `signup:${userId}`,
	});
}

/**
 * Cancelling an open hackathon (published, not started) un-spends the exact
 * credit that paid for it, so it returns to the Founder who published it
 * with its original expiry. Cancel refuses a cancelled trial, so this runs
 * at most once per hackathon.
 */
export async function refundPublishCredit(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
): Promise<void> {
	if (trial.status !== "open" || trial.creditId === undefined) {
		return;
	}
	await ctx.db.patch(trial.creditId, { spentAt: undefined });
}

/** `at` plus `months` calendar months in UTC, clamping the day (Jan 31 → Feb 28). */
export function addMonthsUTC(at: number, months: number): number {
	const date = new Date(at);
	const day = date.getUTCDate();
	date.setUTCDate(1);
	date.setUTCMonth(date.getUTCMonth() + months);
	const lastDay = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
	).getUTCDate();
	date.setUTCDate(Math.min(day, lastDay));
	return date.getTime();
}

/** Which Pro month `now` falls in, counted from `proStartedAt`, and when it ends. */
export function proMonthOf(
	proStartedAt: number,
	now: number,
): { month: number; endsAt: number } {
	const start = new Date(proStartedAt);
	const at = new Date(now);
	let month =
		(at.getUTCFullYear() - start.getUTCFullYear()) * 12 +
		(at.getUTCMonth() - start.getUTCMonth());
	if (addMonthsUTC(proStartedAt, month) > now) {
		month -= 1;
	}
	month = Math.max(month, 0);
	return { month, endsAt: addMonthsUTC(proStartedAt, month + 1) };
}

/**
 * This Pro month's credits: 2, expiring when the month ends, so they never
 * bank. Keyed by the Pro run and month, so repeats grant nothing and a
 * resubscribe starts fresh. Expired unspent Pro credits are deleted so they
 * can't crowd the bounded balance read.
 */
export async function grantProMonthCredits(
	ctx: MutationCtx,
	user: Doc<"users">,
	now: number,
): Promise<void> {
	if (user.planTier !== "pro" || user.proStartedAt === undefined) {
		return;
	}
	const unspent = await ctx.db
		.query("hackathonCredits")
		.withIndex("by_owner_and_spent", (q) =>
			q.eq("ownerUserId", user._id).eq("spentAt", undefined),
		)
		.take(MAX_USER_CREDITS);
	for (const credit of unspent) {
		if (credit.source === "pro_monthly" && !isSpendable(credit, now)) {
			await ctx.db.delete(credit._id);
		}
	}

	const { month, endsAt } = proMonthOf(user.proStartedAt, now);
	for (let index = 1; index <= PRO_MONTHLY_CREDITS; index += 1) {
		await grantCredit(ctx, {
			ownerUserId: user._id,
			source: "pro_monthly",
			grantKey: `pro_monthly:${user._id}:${user.proStartedAt}:${month}:${index}`,
			expiresAt: endsAt,
		});
	}
}
