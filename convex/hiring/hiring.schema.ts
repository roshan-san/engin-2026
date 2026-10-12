import { defineTable } from "convex/server";
import { v } from "convex/values";

export const jobRole = v.union(
	v.literal("frontend"),
	v.literal("backend"),
	v.literal("fullstack"),
	v.literal("designer"),
	v.literal("marketing"),
	v.literal("sales"),
	v.literal("ops"),
	v.literal("other"),
);
export const jobPay = v.union(
	v.literal("3_6l"),
	v.literal("6_9l"),
	v.literal("9_15l"),
	v.literal("equity"),
	v.literal("unpaid"),
);
export const jobMode = v.union(
	v.literal("remote"),
	v.literal("onsite"),
	v.literal("hybrid"),
);
export const hackathonStatus = v.union(
	v.literal("draft"),
	v.literal("open"),
	v.literal("building"),
	v.literal("deciding"),
	v.literal("done"),
);
export const applicationStatus = v.union(
	v.literal("applied"),
	v.literal("declined"),
	v.literal("building"),
	v.literal("left"),
);
export const decision = v.union(v.literal("hired"), v.literal("not_this_time"));

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
