import { defineTable } from "convex/server";
import { v } from "convex/values";

import {
	applicationStatus,
	decision,
	hackathonStatus,
	hackathonWeeks,
	jobMode,
	jobPay,
	jobRole,
} from "../shared/validators";

export const hiringTables = {
	hackathons: defineTable({
		startupId: v.id("startups"),
		status: hackathonStatus,
		job: v.object({ role: jobRole, pay: jobPay, mode: jobMode }),
		problem: v.string(),
		weeks: hackathonWeeks,
		startsAt: v.number(),
		endsAt: v.number(),
		/** endsAt + 7 days. */
		decideBy: v.number(),
		participantsGet: v.optional(v.string()),
		applicantCount: v.number(),
		/** Set when published; counts against the plan's Hackathons for the billing period. */
		publishedAt: v.optional(v.number()),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_startup_and_publishedAt", ["startupId", "publishedAt"])
		.index("by_status_and_startsAt", ["status", "startsAt"]),

	applications: defineTable({
		hackathonId: v.id("hackathons"),
		userId: v.id("users"),
		answer: v.string(),
		status: applicationStatus,
		shortlisted: v.boolean(),
		walkthroughAt: v.optional(v.number()),
		walkthroughNotes: v.optional(v.string()),
		decision: v.optional(decision),
		feedback: v.optional(v.string()),
		promiseKept: v.optional(v.boolean()),
	})
		.index("by_hackathon_and_status", ["hackathonId", "status"])
		.index("by_hackathon_and_user", ["hackathonId", "userId"])
		.index("by_user", ["userId"]),
};
