import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	generateCode,
	grantCredit,
	grantMonthlyProCredit,
	listSpendableCredits,
	normalizeCode,
} from "../lib/billing/credits";
import {
	LAUNCH_CODE_WINDOW_MS,
	MAX_LAUNCH_CODES,
	MAX_PRO_USERS_SCAN,
	RERUN_CREDIT_TTL_MS,
	RERUN_MIN_APPLICATIONS,
} from "../lib/limits";
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

/**
 * Engin grants this by hand, on request, when a published hackathon drew too
 * few applications (design: Refunds). Applications count, not joins, so
 * rejecting applicants can't produce one.
 */
export const grantRerunCredit = internalMutation({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial?.publishedByUserId) {
			throw new Error(
				"Only a hackathon published through the paid gate can earn a re-run credit",
			);
		}
		if (trial.creditSource === "rerun") {
			throw new Error("A re-run can't earn another re-run credit");
		}
		const now = Date.now();
		if (now <= (trial.applicationDeadline ?? trial.startsAt)) {
			throw new Error("Entry is still open for this hackathon");
		}
		const applications = await ctx.db
			.query("applications")
			.withIndex("by_trial", (q) => q.eq("trialCycleId", trial._id))
			.take(RERUN_MIN_APPLICATIONS);
		if (applications.length >= RERUN_MIN_APPLICATIONS) {
			throw new Error(
				`This hackathon got ${RERUN_MIN_APPLICATIONS} or more applications`,
			);
		}

		const creditId = await grantCredit(ctx, {
			ownerUserId: trial.publishedByUserId,
			source: "rerun",
			grantKey: `rerun:${trial._id}`,
			expiresAt: now + RERUN_CREDIT_TTL_MS,
		});
		if (!creditId) {
			throw new Error("This hackathon already got a re-run credit");
		}
		return creditId;
	},
});

/** Daily (convex/crons.ts): every Pro user gets this month's credit, once. */
export const grantMonthlyProCredits = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const proUsers = await ctx.db
			.query("users")
			.withIndex("by_plan_tier", (q) => q.eq("planTier", "pro"))
			.take(MAX_PRO_USERS_SCAN);

		let granted = 0;
		for (const user of proUsers) {
			if (await grantMonthlyProCredit(ctx, user._id, now)) {
				granted += 1;
			}
		}
		return granted;
	},
});
