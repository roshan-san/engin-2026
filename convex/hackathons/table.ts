import { defineTable } from "convex/server";
import { v } from "convex/values";

import { discipline } from "../lib/disciplines";
import { hackathonStatus, hackathonWeeks, jobMode, jobPay } from "./rules";

export const hackathonsTables = {
	hackathons: defineTable({
		startupId: v.id("startups"),
		status: hackathonStatus,
		job: v.object({
			title: v.string(),
			discipline,
			pay: jobPay,
			mode: jobMode,
		}),
		problem: v.string(),
		weeks: hackathonWeeks,
		startsAt: v.number(),
		endsAt: v.number(),
		/** endsAt + 7 days. */
		decideBy: v.number(),
		/** How many Applicants the Founder's daily digest has counted. */
		applicantsEmailed: v.optional(v.number()),
		/** When it became `done`. Unset on Hackathons finished before this field existed. */
		finishedAt: v.optional(v.number()),
		participantsGet: v.optional(v.string()),
		applicantCount: v.number(),
		/** Set when published; counts against the plan's Hackathons for the billing period. */
		publishedAt: v.optional(v.number()),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_startup_and_publishedAt", ["startupId", "publishedAt"])
		.index("by_status_and_startsAt", ["status", "startsAt"]),
};
