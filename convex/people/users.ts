import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../model/auth";
import { assertUrl, limitText } from "../model/text";
import { requireUsername } from "../model/username";
import {
	loadProfileRecord,
	toOwnProfile,
	toProfileAbout,
	toPublicProfile,
} from "../model/users";
import { TEXT } from "../shared/limits";
import { normalizeUsername } from "../shared/username";
import { discipline } from "../shared/validators";

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
 * (`details` is null); signed in, `details` adds the bio, links and the Record.
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
	Pick<Doc<"users">, "username" | "bio" | "discipline" | "portfolioUrl">
>;

export const updateProfile = mutation({
	args: {
		username: v.optional(v.string()),
		bio: v.optional(v.string()),
		/** `null` clears it. */
		discipline: v.optional(v.union(discipline, v.null())),
		portfolioUrl: v.optional(v.string()),
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
			patch.bio = limitText(args.bio, "Bio", TEXT.bio);
		}
		if (args.discipline !== undefined) {
			patch.discipline = args.discipline ?? undefined;
		}
		if (args.portfolioUrl !== undefined) {
			patch.portfolioUrl = assertUrl(args.portfolioUrl, "Portfolio");
		}

		await ctx.db.patch(userId, patch);
	},
});
