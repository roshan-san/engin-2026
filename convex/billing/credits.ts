import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	generateCode,
	listSpendableCredits,
	normalizeCode,
} from "../lib/billing/credits";
import { LAUNCH_CODE_WINDOW_MS, MAX_LAUNCH_CODES } from "../lib/limits";
import { requireText } from "../lib/text";

export const balance = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const credits = await listSpendableCredits(ctx, userId, Date.now());
		return {
			available: credits.length,
			credits: credits.map((credit) => ({
				_id: credit._id,
				source: credit.source,
				expiresAt: credit.expiresAt ?? null,
			})),
		};
	},
});

export const claimLaunchCode = mutation({
	args: { code: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const code = normalizeCode(args.code);
		const credit = code
			? await ctx.db
					.query("hackathonCredits")
					.withIndex("by_code", (q) => q.eq("code", code))
					.first()
			: null;
		if (!credit) {
			throw new Error("That code doesn't exist. Check it and try again.");
		}
		if (credit.ownerUserId !== undefined) {
			throw new Error("That code has already been used.");
		}

		await ctx.db.patch(credit._id, {
			ownerUserId: userId,
			claimedAt: Date.now(),
		});
	},
});

/**
 * Run by Engin (`pnpm exec convex run billing/credits:createLaunchCode`).
 * UPI codes are paid for, so only free launch codes count against the budget.
 */
export const createLaunchCode = internalMutation({
	args: {
		source: v.union(v.literal("launch"), v.literal("upi")),
		issuedTo: v.string(),
	},
	handler: async (ctx, args) => {
		const issuedTo = requireText(args.issuedTo, "Issued to");
		if (args.source === "launch") {
			const since = Date.now() - LAUNCH_CODE_WINDOW_MS;
			const recent = await ctx.db
				.query("hackathonCredits")
				.withIndex("by_source", (q) =>
					q.eq("source", "launch").gt("_creationTime", since),
				)
				.take(MAX_LAUNCH_CODES);
			if (recent.length >= MAX_LAUNCH_CODES) {
				throw new Error(
					`The launch-code budget is ${MAX_LAUNCH_CODES} codes per 90 days`,
				);
			}
		}

		const code = generateCode();
		await ctx.db.insert("hackathonCredits", {
			source: args.source,
			code,
			issuedTo,
		});
		return code.toUpperCase();
	},
});
