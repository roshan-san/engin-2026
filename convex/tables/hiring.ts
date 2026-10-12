import { defineTable } from "convex/server";
import { v } from "convex/values";

import {
	applicationStatus,
	decision,
	hackathonStatus,
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
		weeks: v.union(v.literal(1), v.literal(2)),
		startsAt: v.number(),
		endsAt: v.number(),
		/** endsAt + 7 days. */
		decideBy: v.number(),
		buildersGet: v.optional(v.string()),
		builderCount: v.number(),
		applicantCount: v.number(),
	})
		.index("by_startup", ["startupId"])
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
