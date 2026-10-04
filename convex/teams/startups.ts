import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_LOCATION,
	MAX_PITCH_SECTION,
	MAX_TEAM_BLURB,
	TECH_STACK_LIMITS,
} from "../lib/limits";
import {
	assertUrl,
	limitText,
	normalizeTags,
	optionalText,
	requireText,
} from "../lib/text";
import { toPublicUser } from "../people/users.rules";
import { startupStage } from "../schema";
import { parseCategory } from "./catalog.rules";
import {
	getMembership,
	loadMembershipsOf,
	requireFounderMembership,
	requireMembership,
} from "./membership.rules";
import { loadStartupPlan } from "./plan.rules";
import { toSearchText, uniqueSlug } from "./startups.rules";

/** Every Startup the caller belongs to, for the switcher and palette (SHELL-07). */
export const listMemberships = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const user = await ctx.db.get(userId);
		const memberships = await loadMembershipsOf(ctx, userId);

		return memberships.map((entry) => ({
			startup: {
				_id: entry.startup._id,
				name: entry.startup.name,
				slug: entry.startup.slug,
			},
			role: entry.role,
			isFocused: user?.focusedStartupId === entry.startup._id,
		}));
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
			searchText: toSearchText({ name, tagline, description, category, stage }),
		});

		await ctx.db.insert("memberships", {
			startupId,
			userId,
			role: "founder",
		});

		await ctx.db.patch(userId, { focusedStartupId: startupId });

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
		problem: v.optional(v.string()),
		solution: v.optional(v.string()),
		product: v.optional(v.string()),
		traction: v.optional(v.string()),
		teamBlurb: v.optional(v.string()),
		techStack: v.optional(v.array(v.string())),
		location: v.optional(v.string()),
		remote: v.optional(v.boolean()),
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
			problem:
				args.problem === undefined
					? startup.problem
					: limitText(args.problem, "Problem", MAX_PITCH_SECTION),
			solution:
				args.solution === undefined
					? startup.solution
					: limitText(args.solution, "Solution", MAX_PITCH_SECTION),
			product:
				args.product === undefined
					? startup.product
					: limitText(args.product, "Product", MAX_PITCH_SECTION),
			traction:
				args.traction === undefined
					? startup.traction
					: limitText(args.traction, "Traction", MAX_PITCH_SECTION),
			teamBlurb:
				args.teamBlurb === undefined
					? startup.teamBlurb
					: limitText(args.teamBlurb, "Team blurb", MAX_TEAM_BLURB),
			techStack:
				args.techStack === undefined
					? startup.techStack
					: normalizeTags(args.techStack, TECH_STACK_LIMITS),
			location:
				args.location === undefined
					? startup.location
					: limitText(args.location, "Location", MAX_LOCATION),
			remote: args.remote === undefined ? startup.remote : args.remote,
			isPublic: args.isPublic ?? startup.isPublic,
			searchText: toSearchText({ name, tagline, description, category, stage }),
		});

		return args.startupId;
	},
});

/**
 * Sets the caller's Focused Startup (SHELL-07).
 */
export const focus = mutation({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);
		await ctx.db.patch(userId, { focusedStartupId: args.startupId });
		return args.startupId;
	},
});

/**
 * Resolves a Startup by slug for `/s/$slug` routing (SHELL-02/SHELL-07).
 * Never throws on "no such Startup" or "not a Member" — both return the same
 * shape a caller can't distinguish, so a non-Member can't probe Stealth
 * Startups for existence (T-01-02).
 */
export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const startup = await ctx.db
			.query("startups")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();

		if (!startup) {
			return null;
		}

		const membership = await getMembership(ctx, startup._id, userId);

		if (!membership) {
			if (!startup.isPublic) {
				return null;
			}
			return {
				startup: {
					_id: startup._id,
					name: startup.name,
					slug: startup.slug,
				},
				role: null,
				isFocused: false as const,
				plan: null,
			};
		}

		const user = await ctx.db.get(userId);
		return {
			startup,
			role: membership.role,
			isFocused: user?.focusedStartupId === startup._id,
			plan: await loadStartupPlan(ctx, startup),
		};
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

		// Team member profiles and membership state are signed-in only.
		const team: {
			role: Doc<"memberships">["role"];
			user: ReturnType<typeof toPublicUser>;
		}[] = [];
		let membership: Doc<"memberships"> | null = null;

		if (userId) {
			membership = await getMembership(ctx, startup._id, userId);

			const memberships = await ctx.db
				.query("memberships")
				.withIndex("by_startup", (q) => q.eq("startupId", startup._id))
				.take(50);

			for (const member of memberships) {
				const user = await ctx.db.get(member.userId);
				if (user) {
					team.push({
						role: member.role,
						user: toPublicUser(user),
					});
				}
			}
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
			problem: startup.problem ?? null,
			solution: startup.solution ?? null,
			product: startup.product ?? null,
			traction: startup.traction ?? null,
			teamBlurb: startup.teamBlurb ?? null,
			techStack: startup.techStack ?? [],
			location: startup.location ?? null,
			remote: startup.remote ?? null,
			isAuthenticated: userId !== null,
			isMember: membership !== null,
			team,
		};
	},
});
