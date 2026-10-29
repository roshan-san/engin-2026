import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { WEEK_MS, weekOf } from "./cycles/rules";
import { rateStartup, rateUser } from "./rating/model";
import { RATING_PAGE } from "./rating/rules";

const pageArgs = {
	week: v.optional(v.string()),
	cursor: v.optional(v.union(v.string(), v.null())),
};

/** The weekly run, page by page: every Startup, then every person. */
export const rateStartups = internalMutation({
	args: pageArgs,
	handler: async (ctx, args) => {
		const week = args.week ?? weekOf(Date.now() - WEEK_MS);
		const page = await ctx.db
			.query("startups")
			.paginate({ cursor: args.cursor ?? null, numItems: RATING_PAGE });

		await Promise.all(
			page.page.map((startup) => rateStartup(ctx, startup, week)),
		);

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, internal.rating.rateStartups, {
				week,
				cursor: page.continueCursor,
			});
		} else {
			await ctx.scheduler.runAfter(0, internal.rating.rateUsers, { week });
		}
	},
});

export const rateUsers = internalMutation({
	args: pageArgs,
	handler: async (ctx, args) => {
		const week = args.week ?? weekOf(Date.now() - WEEK_MS);
		const now = Date.now();
		const page = await ctx.db
			.query("users")
			.paginate({ cursor: args.cursor ?? null, numItems: RATING_PAGE });

		await Promise.all(page.page.map((user) => rateUser(ctx, user, week, now)));

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, internal.rating.rateUsers, {
				week,
				cursor: page.continueCursor,
			});
		}
	},
});
