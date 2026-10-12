import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../model/auth";
import { TEXT } from "../shared/limits";
import { assertUrl, limitText } from "../model/text";
import { discipline } from "../shared/validators";
import { normalizeUsername, requireUsername } from "../model/username";
import {
	loadProfileRecord,
	toOwnProfile,
	toPublicProfile,
} from "../model/users";

export const getMe = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		const user = userId ? await ctx.db.get(userId) : null;
		return user ? toOwnProfile(user) : null;
	},
});

export const getByUsername = query({
	args: { username: v.string() },
	handler: async (ctx, args) => {
		const username = normalizeUsername(args.username);
		const user = await ctx.db
			.query("users")
			.withIndex("by_username", (q) => q.eq("username", username))
			.unique();
		return user ? toPublicProfile(user) : null;
	},
});

/** A profile and its Record, for anyone. */
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
		return {
			...toPublicProfile(user),
			...(await loadProfileRecord(ctx, user, Date.now())),
		};
	},
});

type ProfilePatch = Partial<
	Pick<
		Doc<"users">,
		| "username"
		| "bio"
		| "discipline"
		| "linkedinUrl"
		| "portfolioUrl"
		| "githubUrl"
	>
>;

export const updateProfile = mutation({
	args: {
		username: v.optional(v.string()),
		bio: v.optional(v.string()),
		/** `null` clears it. */
		discipline: v.optional(v.union(discipline, v.null())),
		linkedinUrl: v.optional(v.string()),
		portfolioUrl: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
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
		if (args.linkedinUrl !== undefined) {
			patch.linkedinUrl = assertUrl(args.linkedinUrl, "LinkedIn");
		}
		if (args.portfolioUrl !== undefined) {
			patch.portfolioUrl = assertUrl(args.portfolioUrl, "Portfolio");
		}
		if (args.githubUrl !== undefined) {
			patch.githubUrl = assertUrl(args.githubUrl, "GitHub");
		}

		await ctx.db.patch(userId, patch);
	},
});
