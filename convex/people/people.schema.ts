import { defineTable } from "convex/server";
import { v } from "convex/values";

export const discipline = v.union(
	v.literal("engineer"),
	v.literal("designer"),
	v.literal("marketing"),
	v.literal("sales"),
	v.literal("ops"),
	v.literal("other"),
);

export const peopleTables = {
	users: defineTable({
		name: v.optional(v.string()),
		image: v.optional(v.string()),
		email: v.optional(v.string()),
		emailVerificationTime: v.optional(v.number()),
		username: v.optional(v.string()),
		bio: v.optional(v.string()),
		discipline: v.optional(discipline),
		linkedinUrl: v.optional(v.string()),
		portfolioUrl: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
		/** A person's Rating; starts at STARTING_RATING on sign-up. */
		rating: v.optional(v.number()),
		/** The Rating's change over the last rated week. */
		ratingChange: v.optional(v.number()),
		/** Weeks that have counted toward the Rating. */
		ratedWeeks: v.optional(v.number()),
		investorVerifiedAt: v.optional(v.number()),
	})
		.index("email", ["email"])
		.index("by_username", ["username"]),
};
