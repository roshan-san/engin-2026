import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_BANKED_PRO_CREDITS, MAX_USER_CREDITS } from "../lib/limits";
import type { creditSource } from "../schema";

type CreditCtx = QueryCtx | MutationCtx;

type CreditSource = Infer<typeof creditSource>;

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 12;

/** Codes are stored lowercase without spaces or dashes, so claiming ignores all three. */
export function normalizeCode(code: string): string {
	return code.toLowerCase().replace(/[\s-]/g, "");
}

/** 12 characters from a 31-letter alphabet, so guessing one is infeasible (eng review C6). */
export function generateCode(): string {
	const bytes = new Uint8Array(CODE_LENGTH);
	crypto.getRandomValues(bytes);
	return Array.from(
		bytes,
		(byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length],
	).join("");
}

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

/** A publish spends the first of these it finds (eng review, spend order). */
const CREDIT_SPEND_ORDER: readonly CreditSource[] = [
	"launch",
	"rerun",
	"pro_monthly",
	"upi",
	"purchase",
];

const NO_CREDIT_MESSAGE =
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

/** UTC calendar month, e.g. "2026-10". */
function monthKey(now: number): string {
	return new Date(now).toISOString().slice(0, 7);
}

/**
 * This month's Pro credit, once per user per month, while fewer than 3 are
 * banked. Keyed by user and month so yearly plans get monthly credits too.
 */
export async function grantMonthlyProCredit(
	ctx: MutationCtx,
	userId: Id<"users">,
	now: number,
): Promise<boolean> {
	const banked = (await listSpendableCredits(ctx, userId, now)).filter(
		(credit) => credit.source === "pro_monthly",
	);
	if (banked.length >= MAX_BANKED_PRO_CREDITS) {
		return false;
	}
	const creditId = await grantCredit(ctx, {
		ownerUserId: userId,
		source: "pro_monthly",
		grantKey: `pro_monthly:${userId}:${monthKey(now)}`,
	});
	return creditId !== null;
}

/** Banked Pro credits stay usable until `at`, then lapse (eng review C5). */
export async function expireProCredits(
	ctx: MutationCtx,
	userId: Id<"users">,
	at: number,
): Promise<void> {
	for (const credit of await listSpendableCredits(ctx, userId, Date.now())) {
		if (
			credit.source === "pro_monthly" &&
			(credit.expiresAt === undefined || credit.expiresAt > at)
		) {
			await ctx.db.patch(credit._id, { expiresAt: at });
		}
	}
}

/** A resubscribe undoes `expireProCredits`: banked Pro credits no longer lapse. */
export async function keepProCredits(
	ctx: MutationCtx,
	userId: Id<"users">,
	now: number,
): Promise<void> {
	for (const credit of await listSpendableCredits(ctx, userId, now)) {
		if (credit.source === "pro_monthly" && credit.expiresAt !== undefined) {
			await ctx.db.patch(credit._id, { expiresAt: undefined });
		}
	}
}
