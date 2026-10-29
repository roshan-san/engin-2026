import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { limitText } from "./lib/text";
import {
	loadProfileRecord,
	toOwnProfile,
	toProfileAbout,
	toPublicProfile,
} from "./users/model";
import { discipline, normalizeUsername, USER_TEXT } from "./users/rules";
import { requireUsername } from "./users/username";

export const getMe = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		const user = userId ? await ctx.db.get(userId) : null;
		return user ? toOwnProfile(user) : null;
	},
});

/**
 * A profile, for anyone. Signed out, it's only the name, Discipline and Rating
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
						...(await loadProfileRecord(ctx, user, Date.now())),
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
