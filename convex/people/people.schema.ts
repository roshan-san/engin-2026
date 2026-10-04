import { defineTable } from "convex/server";
import { v } from "convex/values";

export const planTier = v.union(v.literal("free"), v.literal("pro"));

export const peopleTables = {
	users: defineTable({
		name: v.optional(v.string()),
		image: v.optional(v.string()),
		email: v.optional(v.string()),
		emailVerificationTime: v.optional(v.number()),
		planTier: v.optional(planTier),
		/** When the current Pro run began; Pro months and their credits count from it. */
		proStartedAt: v.optional(v.number()),
		username: v.optional(v.string()),
		bio: v.optional(v.string()),
		skills: v.optional(v.array(v.string())),
		location: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
		linkedinUrl: v.optional(v.string()),
		portfolioUrl: v.optional(v.string()),
		/** Denormalised Score. Recomputed from verified work. */
		score: v.optional(v.number()),
		focusedStartupId: v.optional(v.id("startups")),
		hideFromExplore: v.optional(v.boolean()),
	})
		.index("email", ["email"])
		.index("by_username", ["username"])
		.index("by_plan_tier", ["planTier"]),
};
