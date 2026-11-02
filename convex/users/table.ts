import { defineTable } from "convex/server";
import { v } from "convex/values";

import { discipline } from "../lib/disciplines";

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
		/** Set once someone else approves one of their Cards; lists them on Explore People. */
		approvedWork: v.optional(v.literal(true)),
	})
		.index("email", ["email"])
		.index("by_username", ["username"])
		.index("by_approvedWork_and_rating", ["approvedWork", "rating"])
		.index("by_approvedWork_and_discipline_and_rating", [
			"approvedWork",
			"discipline",
			"rating",
		]),
};
