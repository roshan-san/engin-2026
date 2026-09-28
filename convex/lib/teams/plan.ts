import type { Doc } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { isProUser } from "../auth";
import {
	MAX_PLAN_USAGE_SCAN,
	MAX_STARTUP_FOUNDERS,
	PLAN_LIMITS,
	type PlanLimits,
} from "../limits";
import { isInviteLive } from "./invites";

type PlanCtx = QueryCtx | MutationCtx;

export type StartupPlan = {
	tier: "free" | "pro";
	limits: PlanLimits;
	usage: {
		openRoles: number;
		liveTrialCycles: number;
		members: number;
		stealth: boolean;
	};
};

/**
 * Interim Plan derivation (A1): until the Plan moves onto the Startup
 * (Phase 6), a Startup is Pro when any Founder's `planTier` is Pro (ADR 0005;
 * CONTEXT.md Claude's-discretion recommendation). Phase 6 swaps the source,
 * not this shape.
 */
export async function loadStartupPlan(
	ctx: PlanCtx,
	startup: Doc<"startups">,
): Promise<StartupPlan> {
	const founders = await ctx.db
		.query("memberships")
		.withIndex("by_startup_and_role", (q) =>
			q.eq("startupId", startup._id).eq("role", "founder"),
		)
		.take(MAX_STARTUP_FOUNDERS);

	let tier: "free" | "pro" = "free";
	for (const founder of founders) {
		if (await isProUser(ctx, founder.userId)) {
			tier = "pro";
			break;
		}
	}

	const limits = PLAN_LIMITS[tier];

	const openRoles = (
		await ctx.db
			.query("roles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", startup._id).eq("status", "open"),
			)
			.take(MAX_PLAN_USAGE_SCAN)
	).length;

	const openTrials = await ctx.db
		.query("trialCycles")
		.withIndex("by_startup_and_status", (q) =>
			q.eq("startupId", startup._id).eq("status", "open"),
		)
		.take(MAX_PLAN_USAGE_SCAN);
	const activeTrials = await ctx.db
		.query("trialCycles")
		.withIndex("by_startup_and_status", (q) =>
			q.eq("startupId", startup._id).eq("status", "active"),
		)
		.take(MAX_PLAN_USAGE_SCAN);
	const liveTrialCycles = openTrials.length + activeTrials.length;

	// Members (non-Founders), plus pending Invites to become a Member, plus
	// pending Offers (#19).
	const memberCount = (
		await ctx.db
			.query("memberships")
			.withIndex("by_startup_and_role", (q) =>
				q.eq("startupId", startup._id).eq("role", "member"),
			)
			.take(MAX_PLAN_USAGE_SCAN)
	).length;

	const pendingInvites = await ctx.db
		.query("invites")
		.withIndex("by_startup_and_status", (q) =>
			q.eq("startupId", startup._id).eq("status", "pending"),
		)
		.take(MAX_PLAN_USAGE_SCAN);
	const pendingMemberInvites = pendingInvites.filter(
		(invite) => invite.role === "member" && isInviteLive(invite),
	).length;

	const pendingOffers = (
		await ctx.db
			.query("offers")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", startup._id).eq("status", "pending"),
			)
			.take(MAX_PLAN_USAGE_SCAN)
	).length;

	const members = memberCount + pendingMemberInvites + pendingOffers;

	return {
		tier,
		limits,
		usage: {
			openRoles,
			liveTrialCycles,
			members,
			stealth: !startup.isPublic,
		},
	};
}
