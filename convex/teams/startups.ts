import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { toPublicUser } from "../lib/people/users";
import { parseCategory, startupStage } from "../lib/teams/catalog";
import {
	getMembership,
	requireFounderMembership,
	requireMembership,
} from "../lib/teams/membership";
import { toSearchText, uniqueSlug } from "../lib/teams/startupWrite";
import { assertUrl, optionalText, requireText } from "../lib/text";

type WorkspaceEntry = {
	startup: Doc<"startups">;
	role: Doc<"memberships">["role"];
};

async function loadWorkspace(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<WorkspaceEntry[]> {
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(50);

	const entries: WorkspaceEntry[] = [];
	for (const membership of memberships) {
		const startup = await ctx.db.get(membership.startupId);
		if (startup) {
			entries.push({ startup, role: membership.role });
		}
	}

	entries.sort((a, b) => a.startup.name.localeCompare(b.startup.name));
	return entries;
}

export const getWorkspace = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const user = await ctx.db.get(userId);
		const startups = await loadWorkspace(ctx, userId);

		if (startups.length === 0) {
			return { active: null, startups: [] };
		}

		const active =
			startups.find((entry) => entry.startup._id === user?.activeStartupId) ??
			startups[0];

		return { active, startups };
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		tagline: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		stage: v.optional(startupStage),
		website: v.optional(v.string()),
		twitterUrl: v.optional(v.string()),
		linkedinUrl: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);

		const name = requireText(args.name, "Startup name");
		const tagline = optionalText(args.tagline);
		const description = optionalText(args.description);
		const category = parseCategory(args.category);
		const stage = args.stage;
		const slug = await uniqueSlug(ctx, name);

		const startupId = await ctx.db.insert("startups", {
			founderUserId: userId,
			name,
			slug,
			tagline,
			description,
			category,
			stage,
			website: assertUrl(args.website, "Website"),
			twitterUrl: assertUrl(args.twitterUrl, "Twitter"),
			linkedinUrl: assertUrl(args.linkedinUrl, "LinkedIn"),
			githubUrl: assertUrl(args.githubUrl, "GitHub"),
			isPublic: true,
			followerCount: 0,
			searchText: toSearchText({ name, tagline, description, category, stage }),
		});

		await ctx.db.insert("memberships", {
			startupId,
			userId,
			role: "founder",
		});

		await ctx.db.patch(userId, { activeStartupId: startupId });

		return { startupId, slug };
	},
});

export const update = mutation({
	args: {
		startupId: v.id("startups"),
		name: v.optional(v.string()),
		tagline: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		stage: v.optional(startupStage),
		website: v.optional(v.string()),
		twitterUrl: v.optional(v.string()),
		linkedinUrl: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
		isPublic: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		const startup = await ctx.db.get(args.startupId);
		if (!startup) {
			throw new Error("Startup not found");
		}

		const name = args.name
			? requireText(args.name, "Startup name")
			: startup.name;
		const tagline =
			args.tagline === undefined ? startup.tagline : optionalText(args.tagline);
		const description =
			args.description === undefined
				? startup.description
				: optionalText(args.description);
		const category =
			args.category === undefined
				? startup.category
				: parseCategory(args.category);
		const stage = args.stage === undefined ? startup.stage : args.stage;

		await ctx.db.patch(args.startupId, {
			name,
			tagline,
			description,
			category,
			stage,
			website:
				args.website === undefined
					? startup.website
					: assertUrl(args.website, "Website"),
			twitterUrl:
				args.twitterUrl === undefined
					? startup.twitterUrl
					: assertUrl(args.twitterUrl, "Twitter"),
			linkedinUrl:
				args.linkedinUrl === undefined
					? startup.linkedinUrl
					: assertUrl(args.linkedinUrl, "LinkedIn"),
			githubUrl:
				args.githubUrl === undefined
					? startup.githubUrl
					: assertUrl(args.githubUrl, "GitHub"),
			isPublic: args.isPublic ?? startup.isPublic,
			searchText: toSearchText({ name, tagline, description, category, stage }),
		});

		return args.startupId;
	},
});

export const setActive = mutation({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);
		await ctx.db.patch(userId, { activeStartupId: args.startupId });
		return args.startupId;
	},
});

export const getPublic = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const startup = await ctx.db
			.query("startups")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();

		if (!startup?.isPublic) {
			return null;
		}

		const userId = await getAuthUserId(ctx);
		const membership = userId
			? await getMembership(ctx, startup._id, userId)
			: null;

		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_startup", (q) => q.eq("startupId", startup._id))
			.take(50);

		const team = [];
		for (const member of memberships) {
			const user = await ctx.db.get(member.userId);
			if (user) {
				team.push({
					role: member.role,
					user: toPublicUser(user),
				});
			}
		}

		let isFollowing = false;
		if (userId) {
			const follow = await ctx.db
				.query("follows")
				.withIndex("by_user_and_startup", (q) =>
					q.eq("userId", userId).eq("startupId", startup._id),
				)
				.unique();
			isFollowing = follow !== null;
		}

		return {
			_id: startup._id,
			name: startup.name,
			slug: startup.slug,
			tagline: startup.tagline ?? null,
			description: startup.description ?? null,
			category: startup.category ?? null,
			stage: startup.stage ?? null,
			website: startup.website ?? null,
			twitterUrl: startup.twitterUrl ?? null,
			linkedinUrl: startup.linkedinUrl ?? null,
			githubUrl: startup.githubUrl ?? null,
			followerCount: startup.followerCount,
			isAuthenticated: userId !== null,
			isMember: membership !== null,
			isFollowing,
			team,
		};
	},
});
