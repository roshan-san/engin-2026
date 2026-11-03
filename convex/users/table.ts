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
		/** A person's Momentum; starts at STARTING_MOMENTUM on sign-up. */
		momentum: v.optional(v.number()),
		/** The Momentum's change over the last scored week. */
		momentumChange: v.optional(v.number()),
		/** Weeks that have counted toward the Momentum. */
		scoredWeeks: v.optional(v.number()),
		/** The week key last scored, so a rerun skips the row. */
		scoredThrough: v.optional(v.string()),
		/** Set by the weekly run; absent means provisional. */
		provisional: v.optional(v.boolean()),
		/** Set once someone else approves one of their Cards; lists them on Explore People. */
		approvedWork: v.optional(v.literal(true)),
	})
		.index("email", ["email"])
		.index("by_username", ["username"])
		.index("by_approvedWork_and_momentum", ["approvedWork", "momentum"])
		.index("by_approvedWork_and_discipline_and_momentum", [
			"approvedWork",
			"discipline",
			"momentum",
		]),
};
