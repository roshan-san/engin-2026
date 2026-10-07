import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_PRO_USERS_SCAN,
	RERUN_CREDIT_TTL_MS,
	RERUN_MIN_APPLICATIONS,
} from "../lib/limits";
import {
	grantCredit,
	grantProMonthCredits,
	listSpendableCredits,
} from "./credits.rules";

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

/**
 * Engin grants this by hand, on request, when a published hackathon drew too
 * few applications (design: Refunds). Applications count, not joins, so
 * rejecting applicants can't produce one.
 */
export const grantRerunCredit = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon?.publishedByUserId) {
			throw new Error(
				"Only a hackathon published through the paid gate can earn a re-run credit",
			);
		}
		if (hackathon.creditSource === "rerun") {
			throw new Error("A re-run can't earn another re-run credit");
		}
		const now = Date.now();
		if (now <= (hackathon.applicationDeadline ?? hackathon.startsAt)) {
			throw new Error("Entry is still open for this hackathon");
		}
		const applications = await ctx.db
			.query("applications")
			.withIndex("by_hackathon", (q) => q.eq("hackathonId", hackathon._id))
			.take(RERUN_MIN_APPLICATIONS);
		if (applications.length >= RERUN_MIN_APPLICATIONS) {
			throw new Error(
				`This hackathon got ${RERUN_MIN_APPLICATIONS} or more applications`,
			);
		}

		const creditId = await grantCredit(ctx, {
			ownerUserId: hackathon.publishedByUserId,
			source: "rerun",
			grantKey: `rerun:${hackathon._id}`,
			expiresAt: now + RERUN_CREDIT_TTL_MS,
		});
		if (!creditId) {
			throw new Error("This hackathon already got a re-run credit");
		}
		return creditId;
	},
});

/**
 * Daily: starts each Pro user's new Pro month with its credits. Yearly Pro
 * has no monthly webhook, and a late renewal webhook shouldn't delay them.
 * A Pro user from before Pro months existed starts one today.
 */
export const grantProCredits = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const proUsers = await ctx.db
			.query("users")
			.withIndex("by_plan_tier", (q) => q.eq("planTier", "pro"))
			.take(MAX_PRO_USERS_SCAN);

		for (const user of proUsers) {
			if (user.proStartedAt === undefined) {
				await ctx.db.patch(user._id, { proStartedAt: now });
			}
			await grantProMonthCredits(
				ctx,
				{ ...user, proStartedAt: user.proStartedAt ?? now },
				now,
			);
		}
	},
});
