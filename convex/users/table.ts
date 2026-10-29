import { defineTable } from "convex/server";
import { v } from "convex/values";

import { discipline } from "./rules";

export const usersTables = {
	users: defineTable({
		name: v.optional(v.string()),
		image: v.optional(v.string()),
		email: v.optional(v.string()),
		emailVerificationTime: v.optional(v.number()),
		username: v.optional(v.string()),
		bio: v.optional(v.string()),
		discipline: v.optional(discipline),
		/** A person's Rating; starts at STARTING_RATING on sign-up. */
		rating: v.optional(v.number()),
		/** The Rating's change over the last rated week. */
		ratingChange: v.optional(v.number()),
		/** Weeks that have counted toward the Rating. */
		ratedWeeks: v.optional(v.number()),
		/** The week key last rated, so a rerun skips the row. */
		ratedThrough: v.optional(v.string()),
		/** Set by the weekly run; absent means provisional. */
		provisional: v.optional(v.boolean()),
		investorVerifiedAt: v.optional(v.number()),
	})
		.index("email", ["email"])
		.index("by_username", ["username"]),
};
