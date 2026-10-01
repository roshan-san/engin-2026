import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { internalQuery, mutation, query } from "../_generated/server";
import { initUserProfile, requireUserId } from "../lib/auth";
import { requireUsername } from "../lib/people/username";
import { toPublicUser } from "../lib/people/users";
import { loadProofOfWork } from "../lib/reputation/proofOfWork";
import { loadScoreEvidence } from "../lib/reputation/score";
import { loadTrialHistory } from "../lib/reputation/trialHistory";
import { assertUrl, optionalText } from "../lib/text";

const MAX_BIO = 280;
const MAX_HEADLINE = 80;
const MAX_LOCATION = 80;
const MAX_SKILLS = 10;
const MAX_SKILL_LENGTH = 32;

type ProfilePatch = Partial<
	Pick<
		Doc<"users">,
		| "name"
		| "username"
		| "bio"
		| "skills"
		| "headline"
		| "location"
		| "githubUrl"
		| "linkedinUrl"
		| "portfolioUrl"
		| "hideFromExplore"
	>
>;

function normalizeSkills(skills: string[] | undefined): string[] | undefined {
	if (!skills) {
		return undefined;
	}

	const unique = [
		...new Set(
			skills
				.map((skill) => skill.trim())
				.filter(
					(skill) => skill.length > 0 && skill.length <= MAX_SKILL_LENGTH,
				),
		),
	].slice(0, MAX_SKILLS);

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

export const getMe = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const user = await ctx.db.get(userId);
		if (!user) {
			return null;
		}

		const evidence = await loadScoreEvidence(ctx, userId);

		return {
			_id: user._id,
			name: user.name ?? null,
			email: user.email ?? null,
			image: user.image ?? null,
			planTier: user.planTier ?? ("free" as const),
			username: user.username ?? null,
			bio: user.bio ?? null,
			skills: user.skills ?? [],
			headline: user.headline ?? null,
			location: user.location ?? null,
			githubUrl: user.githubUrl ?? null,
			linkedinUrl: user.linkedinUrl ?? null,
			portfolioUrl: user.portfolioUrl ?? null,
			focusedStartupId: user.focusedStartupId ?? null,
			hideFromExplore: user.hideFromExplore ?? false,
			evidence,
			score: evidence.score,
		};
	},
});

export const getByUsername = query({
	args: { username: v.string() },
	handler: async (ctx, args) => {
		const username = args.username.trim().toLowerCase();
		const user = await ctx.db
			.query("users")
			.withIndex("by_username", (q) => q.eq("username", username))
			.unique();

		if (!user) {
			return null;
		}

		const evidence = await loadScoreEvidence(ctx, user._id);
		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.take(50);

		const startups = [];
		for (const membership of memberships) {
			const startup = await ctx.db.get(membership.startupId);
			if (startup?.isPublic) {
				startups.push({
					_id: startup._id,
					name: startup.name,
					slug: startup.slug,
					tagline: startup.tagline ?? null,
					role: membership.role,
				});
			}
		}

		const { verdicts, evaluations, trialCyclesLeft } = await loadTrialHistory(
			ctx,
			user._id,
		);

		return {
			...toPublicUser(user),
			verdicts,
			evaluations,
			trialCyclesLeft,
			bio: user.bio ?? null,
			skills: user.skills ?? [],
			location: user.location ?? null,
			githubUrl: user.githubUrl ?? null,
			linkedinUrl: user.linkedinUrl ?? null,
			portfolioUrl: user.portfolioUrl ?? null,
			evidence,
			proofOfWork: await loadProofOfWork(ctx, user._id),
			startups,
		};
	},
});

export const usernameAvailable = query({
	args: { username: v.string() },
	handler: async (ctx, args) => {
		let username: string;
		try {
			username = requireUsername(args.username);
		} catch {
			return false;
		}

		const userId = await getAuthUserId(ctx);
		const existing = await ctx.db
			.query("users")
			.withIndex("by_username", (q) => q.eq("username", username))
			.unique();

		return existing === null || existing._id === userId;
	},
});

export const ensureProfile = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		await initUserProfile(ctx, userId);
		return userId;
	},
});

export const updateProfile = mutation({
	args: {
		name: v.optional(v.string()),
		username: v.optional(v.string()),
		bio: v.optional(v.string()),
		skills: v.optional(v.array(v.string())),
		headline: v.optional(v.string()),
		location: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
		linkedinUrl: v.optional(v.string()),
		portfolioUrl: v.optional(v.string()),
		hideFromExplore: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await initUserProfile(ctx, userId);

		const patch: ProfilePatch = {};

		if (args.name !== undefined) {
			patch.name = optionalText(args.name);
		}

		if (args.username !== undefined) {
			if (!args.username.trim()) {
				patch.username = undefined;
			} else {
				const username = requireUsername(args.username);
				const taken = await ctx.db
					.query("users")
					.withIndex("by_username", (q) => q.eq("username", username))
					.unique();
				if (taken && taken._id !== userId) {
					throw new Error("This username is already taken");
				}
				patch.username = username;
			}
		}

		if (args.bio !== undefined) {
			patch.bio = limitText(args.bio, "Bio", MAX_BIO);
		}
		if (args.skills !== undefined) {
			patch.skills = normalizeSkills(args.skills);
		}
		if (args.headline !== undefined) {
			patch.headline = limitText(args.headline, "Headline", MAX_HEADLINE);
		}
		if (args.location !== undefined) {
			patch.location = limitText(args.location, "Location", MAX_LOCATION);
		}
		if (args.githubUrl !== undefined) {
			patch.githubUrl = assertUrl(args.githubUrl, "GitHub");
		}
		if (args.linkedinUrl !== undefined) {
			patch.linkedinUrl = assertUrl(args.linkedinUrl, "LinkedIn");
		}
		if (args.portfolioUrl !== undefined) {
			patch.portfolioUrl = assertUrl(args.portfolioUrl, "Portfolio");
		}
		if (args.hideFromExplore !== undefined) {
			patch.hideFromExplore = args.hideFromExplore;
		}

		await ctx.db.patch(userId, patch);
		return userId;
	},
});

export const getById = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => await ctx.db.get(args.userId),
});

export const getByEmail = internalQuery({
	args: { email: v.string() },
	handler: async (ctx, args) =>
		await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.unique(),
});
