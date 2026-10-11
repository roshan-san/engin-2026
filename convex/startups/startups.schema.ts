import { defineTable } from "convex/server";
import { v } from "convex/values";

export const startupStage = v.union(
	v.literal("idea"),
	v.literal("building"),
	v.literal("launched"),
	v.literal("earning"),
);
export const startupCategory = v.union(
	v.literal("saas"),
	v.literal("consumer"),
	v.literal("fintech"),
	v.literal("d2c"),
	v.literal("ai"),
	v.literal("marketplace"),
	v.literal("other"),
);
export const startupCity = v.union(
	v.literal("bengaluru"),
	v.literal("delhi_ncr"),
	v.literal("mumbai"),
	v.literal("hyderabad"),
	v.literal("pune"),
	v.literal("chennai"),
	v.literal("remote"),
	v.literal("other"),
);
export const inviteStatus = v.union(
	v.literal("pending"),
	v.literal("accepted"),
	v.literal("declined"),
	v.literal("revoked"),
);

export const startupsTables = {
	startups: defineTable({
		name: v.string(),
		slug: v.string(),
		oneLiner: v.optional(v.string()),
		website: v.optional(v.string()),
		logo: v.optional(v.id("_storage")),
		stage: startupStage,
		category: startupCategory,
		city: startupCity,
		/** The one Founder. */
		founderId: v.id("users"),
		rating: v.number(),
		ratingChange: v.number(),
		/** Active weeks (≥1 verified Card) the weekly run has rated. */
		ratedWeeks: v.number(),
		/** The week key last rated, so a rerun skips the row. */
		ratedThrough: v.optional(v.string()),
		provisional: v.boolean(),
	})
		.index("by_slug", ["slug"])
		.index("by_founder", ["founderId"]),

	contributors: defineTable({
		startupId: v.id("startups"),
		userId: v.id("users"),
	})
		.index("by_startup_and_user", ["startupId", "userId"])
		.index("by_user", ["userId"]),

	invites: defineTable({
		startupId: v.id("startups"),
		email: v.string(),
		invitedBy: v.id("users"),
		status: inviteStatus,
		expiresAt: v.number(),
		/** Set when the Invite brings a hired Builder onto the Startup. */
		hackathonId: v.optional(v.id("hackathons")),
	})
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_email_and_status", ["email", "status"]),
};
