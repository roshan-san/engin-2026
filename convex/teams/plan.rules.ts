import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isProUser } from "../lib/auth";
import {
	MAX_PLAN_USAGE_SCAN,
	MAX_STARTUP_FOUNDERS,
	PLAN_LIMITS,
	type PlanLimits,
} from "../lib/limits";
import { isInviteLive } from "./invitations.rules";

type PlanCtx = QueryCtx | MutationCtx;

type StartupPlan = {
	tier: "free" | "pro";
	limits: PlanLimits;
	usage: {
		openRoles: number;
		members: number;
		stealth: boolean;
	};
};

/**
 * Display-only Plan for a Startup. Paid rights (the Pro tier and hackathon
 * credits) belong to the user, not the Startup (eng review R2): a Startup
 * shows as Pro when any Founder is Pro. Don't move credits onto Startups.
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
			members,
			stealth: !startup.isPublic,
		},
	};
}

/** Refuses adding a Member slot (Member, Member Invite or Offer) past the Plan's cap. */
export async function requireMemberSlot(
	ctx: PlanCtx,
	startup: Doc<"startups">,
): Promise<void> {
	const plan = await loadStartupPlan(ctx, startup);
	if (plan.usage.members >= plan.limits.members) {
		const tier = plan.tier === "pro" ? "Pro" : "Free";
		throw new Error(
			`Your ${tier} plan allows ${plan.limits.members} members, counting pending invites and offers`,
		);
	}
}

/** Stealth mode is Pro only; turning it off is always allowed. */
export async function requireStealthAllowed(
	ctx: PlanCtx,
	startup: Doc<"startups">,
): Promise<void> {
	const plan = await loadStartupPlan(ctx, startup);
	if (!plan.limits.stealth) {
		throw new Error("Stealth mode is a Pro feature");
	}
}
