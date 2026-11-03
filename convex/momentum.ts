import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { WEEK_MS, weekOf } from "./cycles/rules";
import { scoreStartup, scoreUser } from "./momentum/model";
import { MOMENTUM_PAGE } from "./momentum/rules";

const pageArgs = {
	week: v.optional(v.string()),
	cursor: v.optional(v.union(v.string(), v.null())),
};

/** The weekly run, page by page: every person, then every Startup, since a startup averages its team. */
export const scoreUsers = internalMutation({
	args: pageArgs,
	handler: async (ctx, args) => {
		const week = args.week ?? weekOf(Date.now() - WEEK_MS);
		const now = Date.now();
		const page = await ctx.db
			.query("users")
			.paginate({ cursor: args.cursor ?? null, numItems: MOMENTUM_PAGE });

		await Promise.all(page.page.map((user) => scoreUser(ctx, user, week, now)));

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, internal.momentum.scoreUsers, {
				week,
				cursor: page.continueCursor,
			});
		} else {
			await ctx.scheduler.runAfter(0, internal.momentum.scoreStartups, {
				week,
			});
		}
	},
});

export const scoreStartups = internalMutation({
	args: pageArgs,
	handler: async (ctx, args) => {
		const week = args.week ?? weekOf(Date.now() - WEEK_MS);
		const page = await ctx.db
			.query("startups")
			.paginate({ cursor: args.cursor ?? null, numItems: MOMENTUM_PAGE });

		await Promise.all(
			page.page.map((startup) => scoreStartup(ctx, startup, week)),
		);

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, internal.momentum.scoreStartups, {
				week,
				cursor: page.continueCursor,
			});
		}
	},
});
