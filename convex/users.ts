import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { discipline } from "./lib/disciplines";
import { MAX_EXPLORE_ROWS } from "./lib/explore";
import { limitText } from "./lib/text";
import { NO_PROGRESS } from "./momentum/trust";
import {
	loadProfileRecord,
	toOwnProfile,
	toProfileAbout,
	toPublicProfile,
} from "./users/model";
import { normalizeUsername, USER_TEXT } from "./users/rules";
import { requireUsername } from "./users/username";

export const getMe = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		const user = userId ? await ctx.db.get(userId) : null;
		return user ? toOwnProfile(user) : null;
	},
});

/** Your own Trust, with how far you are along each rule; null signed out. Nobody else sees the progress. */
export const myTrust = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		const user = userId ? await ctx.db.get(userId) : null;
		if (!user) {
			return null;
		}
		return {
			trust: user.trust ?? "low",
			held: user.trustHeld === true,
			progress: user.trustProgress ?? NO_PROGRESS,
		};
	},
});

/** People whose work someone else approved, for anyone: best Momentum first, as public profiles. */
export const explore = query({
	args: { discipline: v.optional(discipline) },
	handler: async (ctx, args) => {
		const filter = args.discipline;
		const query =
			filter === undefined
				? ctx.db
						.query("users")
						.withIndex("by_approvedWork_and_momentum", (q) =>
							q.eq("approvedWork", true),
						)
				: ctx.db
						.query("users")
						.withIndex("by_approvedWork_and_discipline_and_momentum", (q) =>
							q.eq("approvedWork", true).eq("discipline", filter),
						);
		const users = await query.order("desc").take(MAX_EXPLORE_ROWS);
		// No username means no page to link to.
		return users.filter((user) => user.username).map(toPublicProfile);
	},
});

/**
 * A profile, for anyone. Signed out, it's only the name, Discipline and Momentum
 * (`details` is null); signed in, `details` adds the bio and the Record.
 */
export const getRecord = query({
	args: { username: v.string() },
	handler: async (ctx, args) => {
		const username = normalizeUsername(args.username);
		const user = await ctx.db
			.query("users")
			.withIndex("by_username", (q) => q.eq("username", username))
			.unique();
		if (!user) {
			return null;
		}
		const viewerId = await getAuthUserId(ctx);
		return {
			...toPublicProfile(user),
			details: viewerId
				? {
						...toProfileAbout(user),
						...(await loadProfileRecord(ctx, user)),
					}
				: null,
		};
	},
});

type ProfilePatch = Partial<
	Pick<Doc<"users">, "username" | "bio" | "discipline">
>;

export const updateProfile = mutation({
	args: {
		username: v.optional(v.string()),
		bio: v.optional(v.string()),
		/** `null` clears it. */
		discipline: v.optional(v.union(discipline, v.null())),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const patch: ProfilePatch = {};

		if (args.username !== undefined) {
			const username = requireUsername(args.username);
			const taken = await ctx.db
				.query("users")
				.withIndex("by_username", (q) => q.eq("username", username))
				.unique();
			if (taken && taken._id !== userId) {
				throw new ConvexError("That username is taken");
			}
			patch.username = username;
		}
		if (args.bio !== undefined) {
			patch.bio = limitText(args.bio, "Bio", USER_TEXT.bio);
		}
		if (args.discipline !== undefined) {
			patch.discipline = args.discipline ?? undefined;
		}

		await ctx.db.patch(userId, patch);
	},
});
