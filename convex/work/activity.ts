import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { loadCycles, loadSignals } from "../model/activity";
import { getStartupBySlug } from "../model/startups";
import { requireTeam } from "../model/teamAccess";
import { isInvestorPro } from "../model/users";
import { CYCLES_PAGE } from "../shared/limits";

/** The team's full Activity: the newest `count` Cycles. */
export const list = query({
	args: { startupId: v.id("startups"), count: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);

		return await loadCycles(ctx, startup, {
			count: args.count ?? CYCLES_PAGE,
			masked: false,
		});
	},
});

/** The Rating and rhythm anyone may see. */
export const getSignals = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const startup = await getStartupBySlug(ctx, args.slug);
		return startup ? await loadSignals(ctx, startup, Date.now()) : null;
	},
});

/** The public Cycles: counts and milestones, or everything for Investor Pro. */
export const listPublic = query({
	args: { slug: v.string(), count: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const startup = await getStartupBySlug(ctx, args.slug);
		if (!startup) {
			return null;
		}
		const userId = await getAuthUserId(ctx);
		const viewer = userId ? await ctx.db.get(userId) : null;
		const full = isInvestorPro(viewer);

		const { cycles, hasMore } = await loadCycles(ctx, startup, {
			count: args.count ?? CYCLES_PAGE,
			masked: !full,
		});
		return { cycles, hasMore, full };
	},
});
