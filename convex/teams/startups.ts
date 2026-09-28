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
import { loadStartupPlan } from "../lib/teams/plan";
import { toSearchText, uniqueSlug } from "../lib/teams/startupWrite";
import { assertUrl, optionalText, requireText } from "../lib/text";

const MAX_PITCH_SECTION = 2000;
const MAX_TEAM_BLURB = 500;
const MAX_LOCATION = 80;
const MAX_TECH_STACK_ITEMS = 12;
const MAX_TECH_ITEM_LENGTH = 24;

function normalizeTechStack(
	techStack: string[] | undefined,
): string[] | undefined {
	if (!techStack) {
		return undefined;
	}

	const unique = [
		...new Set(
			techStack
				.map((item) => item.trim())
				.filter(
					(item) => item.length > 0 && item.length <= MAX_TECH_ITEM_LENGTH,
				),
		),
	].slice(0, MAX_TECH_STACK_ITEMS);

	return unique.length > 0 ? unique : undefined;
}

function limitText(
	value: string | undefined,
	field: string,
	max: number,
): string | undefined {
	const text = optionalText(value);
	if (text && text.length > max) {
		throw new Error(`${field} must be under ${max} characters`);
	}
	return text;
}

type MembershipEntry = {
	startup: Doc<"startups">;
	role: Doc<"memberships">["role"];
};

async function loadMemberships(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<MembershipEntry[]> {
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(50);

	const entries: MembershipEntry[] = [];
	for (const membership of memberships) {
		const startup = await ctx.db.get(membership.startupId);
		if (startup) {
			entries.push({ startup, role: membership.role });
		}
	}

	// Stable order for the switcher (edge SHELL-01/ordering): break ties on slug.
	entries.sort(
		(a, b) =>
			a.startup.name.localeCompare(b.startup.name) ||
			a.startup.slug.localeCompare(b.startup.slug),
	);
	return entries;
}

/** Every Startup the caller belongs to, for the switcher and palette (SHELL-07). */
export const listMemberships = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const user = await ctx.db.get(userId);
		const memberships = await loadMemberships(ctx, userId);

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
					: normalizeTechStack(args.techStack),
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

		// Team member profiles and membership/follow state are signed-in only.
		const team: {
			role: Doc<"memberships">["role"];
			user: ReturnType<typeof toPublicUser>;
		}[] = [];
		let isFollowing = false;
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
			problem: startup.problem ?? null,
			solution: startup.solution ?? null,
			product: startup.product ?? null,
			traction: startup.traction ?? null,
			teamBlurb: startup.teamBlurb ?? null,
			techStack: startup.techStack ?? [],
			location: startup.location ?? null,
			remote: startup.remote ?? null,
			followerCount: startup.followerCount,
			isAuthenticated: userId !== null,
			isMember: membership !== null,
			isFollowing,
			team,
		};
	},
});
