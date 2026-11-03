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
		promiseKept: v.optional(v.boolean()),
	})
		.index("by_hackathon_and_status", ["hackathonId", "status"])
		.index("by_hackathon_and_user", ["hackathonId", "userId"])
		.index("by_user", ["userId"]),
};
