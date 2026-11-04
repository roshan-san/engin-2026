import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { toTeamPerson } from "./contributors/model";
import { CONTRIBUTOR_TEXT, MAX_CONTRIBUTORS } from "./contributors/rules";
import { requireUserId } from "./lib/auth";
import { limitText } from "./lib/text";
import { requireFounder, requireOwner, requireTeam } from "./startups/team";

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
		const toPerson = async (id: Id<"users">) => {
			const user = await ctx.db.get(id);
			return user ? toTeamPerson(user) : null;
		};
		const contributors = await Promise.all(
			rows.map(async (row) => {
				const person = await toPerson(row.userId);
				return person
					? {
							...person,
							discipline: row.discipline,
							label: row.label ?? null,
							isFounder: row.isFounder === true,
						}
					: null;
			}),
		);

		return {
			founder: await toPerson(startup.founderId),
			contributors: contributors.filter((person) => person !== null),
		};
	},
});

/** Your own label on a Startup; blank or `null` clears it. Only Contributors have one. */
export const setMyLabel = mutation({
	args: { startupId: v.id("startups"), label: v.union(v.string(), v.null()) },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const contributor = await ctx.db
			.query("contributors")
			.withIndex("by_startup_and_user", (q) =>
				q.eq("startupId", args.startupId).eq("userId", userId),
			)
			.unique();
		if (!contributor) {
			throw new ConvexError("You're not on this startup");
		}
		await ctx.db.patch(contributor._id, {
			label: limitText(
				args.label ?? undefined,
				"Label",
				CONTRIBUTOR_TEXT.label,
			),
		});
		return null;
	},
});

/** The Founder makes a Contributor a Co-founder, or back. */
export const setCoFounder = mutation({
	args: {
		startupId: v.id("startups"),
		userId: v.id("users"),
		isFounder: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireOwner(ctx, args.startupId, userId);
		const contributor = await ctx.db
			.query("contributors")
			.withIndex("by_startup_and_user", (q) =>
				q.eq("startupId", args.startupId).eq("userId", args.userId),
			)
			.unique();
		if (!contributor) {
			throw new ConvexError("That person isn't on this startup");
		}
		await ctx.db.patch(contributor._id, {
			isFounder: args.isFounder || undefined,
		});
		return null;
	},
});

export const remove = mutation({
	args: { startupId: v.id("startups"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const startup = await requireFounder(ctx, args.startupId, userId);
		if (args.userId === startup.founderId) {
			throw new ConvexError("The Founder can't be removed");
		}

		const contributor = await ctx.db
			.query("contributors")
			.withIndex("by_startup_and_user", (q) =>
				q.eq("startupId", args.startupId).eq("userId", args.userId),
			)
			.unique();
		if (!contributor) {
			throw new ConvexError("That person isn't on this startup");
		}
		await ctx.db.delete(contributor._id);
	},
});

/** You leave a startup's team. Your Cards and threads stay, as when the Founder removes someone. */
export const leave = mutation({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const startup = await ctx.db.get(args.startupId);
		if (!startup) {
			throw new ConvexError("Startup not found");
		}
		if (startup.founderId === userId) {
			throw new ConvexError("The Founder can't leave");
		}

		const contributor = await ctx.db
			.query("contributors")
			.withIndex("by_startup_and_user", (q) =>
				q.eq("startupId", args.startupId).eq("userId", userId),
			)
			.unique();
		if (!contributor) {
			throw new ConvexError("You're not on this startup");
		}
		await ctx.db.delete(contributor._id);
		return null;
	},
});
