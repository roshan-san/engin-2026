import type { Infer } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { creditSource } from "../../schema";
import { MAX_USER_CREDITS } from "../limits";

type CreditCtx = QueryCtx | MutationCtx;

export type CreditSource = Infer<typeof creditSource>;

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

export function isSpendable(
	credit: Doc<"hackathonCredits">,
	now: number,
): boolean {
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
