import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_CONTRIBUTORS } from "../lib/limits";
import { requireFounder, requireTeam } from "./access.rules";
import { loadVerifiedThisCycle, toTeamPerson } from "./contributors.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);

		const rows = await ctx.db
			.query("contributors")
			.withIndex("by_startup_and_user", (q) =>
				q.eq("startupId", args.startupId),
			)
			.take(MAX_CONTRIBUTORS);
		const counts = await loadVerifiedThisCycle(ctx, args.startupId, Date.now());
		const toPerson = async (id: Id<"users">) => {
			const user = await ctx.db.get(id);
			return user ? toTeamPerson(user, counts.get(id) ?? 0) : null;
		};
		const contributors = await Promise.all(
			rows.map((row) => toPerson(row.userId)),
		);

		return {
			founder: await toPerson(startup.founderId),
			contributors: contributors.filter((person) => person !== null),
		};
	},
});

export const remove = mutation({
	args: { startupId: v.id("startups"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const startup = await requireFounder(ctx, args.startupId, userId);
		if (args.userId === startup.founderId) {
			throw new Error("The Founder can't be removed");
		}

		const contributor = await ctx.db
			.query("contributors")
			.withIndex("by_startup_and_user", (q) =>
				q.eq("startupId", args.startupId).eq("userId", args.userId),
			)
			.unique();
		if (!contributor) {
			throw new Error("That person isn't on this startup");
		}
		await ctx.db.delete(contributor._id);
	},
});
