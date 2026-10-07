import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { getCycleMember } from "../work/cycles.rules";
import { requireMembership } from "./membership.rules";

const FEED_SIZE = 20;
const FEED_SCAN_LIMIT = 100;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const dashboard = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const membership = await requireMembership(ctx, args.startupId, userId);
		const isFounder = membership.role === "founder";

		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.take(200);

		const activeCycles = await ctx.db
			.query("cycles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", args.startupId).eq("status", "active"),
			)
			.take(50);

		const openRoles = await ctx.db
			.query("roles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", args.startupId).eq("status", "open"),
			)
			.take(50);

		const openHackathons = await ctx.db
			.query("hackathons")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", args.startupId).eq("status", "open"),
			)
			.take(50);

		const rows = await ctx.db
			.query("activity")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(FEED_SCAN_LIMIT);

		const cutoff = Date.now() - THIRTY_DAYS_MS;
		const verifiedTasksLast30Days = rows.filter(
			(row) => row.kind === "task_verified" && row._creationTime >= cutoff,
		).length;

		const visible = [];
		for (const row of rows) {
			if (isFounder || row.cycleId === undefined) {
				visible.push(row);
				continue;
			}
			if (await getCycleMember(ctx, row.cycleId, userId)) {
				visible.push(row);
			}
			if (visible.length >= FEED_SIZE) {
				break;
			}
		}

		return {
			stats: {
				teamSize: memberships.length,
				activeCycles: activeCycles.length,
				verifiedTasksLast30Days,
				openRoles: openRoles.length,
				openHackathons: openHackathons.length,
			},
			activity: visible.slice(0, FEED_SIZE).map((row) => ({
				_id: row._id,
				kind: row.kind,
				summary: row.summary,
				createdAt: row._creationTime,
			})),
		};
	},
});
