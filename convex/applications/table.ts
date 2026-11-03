import { defineTable } from "convex/server";
import { v } from "convex/values";

import { applicationStatus, decision } from "./rules";

export const applicationsTables = {
	applications: defineTable({
		hackathonId: v.id("hackathons"),
		userId: v.id("users"),
		answer: v.string(),
		status: applicationStatus,
		shortlisted: v.boolean(),
		/** When the Founder posted the Walkthrough questions. */
		walkthroughRequestedAt: v.optional(v.number()),
		walkthroughAt: v.optional(v.number()),
		walkthroughNotes: v.optional(v.string()),
		decision: v.optional(decision),
		/** The Founder didn't decide by `decideBy`, so the deadline gave Not this time. */
		decisionMissed: v.optional(v.boolean()),
		feedback: v.optional(v.string()),
		/** The Offer's one line of terms. `decision: "hired"` means an Offer was made. */
		offerTerms: v.optional(v.string()),
		/** When they accepted the Offer and joined the startup. Only this counts as Joined. */
		joinedAt: v.optional(v.number()),
		offerDeclinedAt: v.optional(v.number()),
		promiseKept: v.optional(v.boolean()),
		/** An accepted Applicant confirms their place by then, or it's released. */
		confirmBy: v.optional(v.number()),
		confirmedAt: v.optional(v.number()),
		/** Declined because they withdrew themselves. */
		withdrawnAt: v.optional(v.number()),
		/** Declined because the Founder removed them as a no-show. */
		removedAt: v.optional(v.number()),
	})
		.index("by_hackathon_and_status", ["hackathonId", "status"])
		.index("by_hackathon_and_user", ["hackathonId", "userId"])
		.index("by_user", ["userId"]),
};
