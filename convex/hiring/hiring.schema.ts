import { defineTable } from "convex/server";
import { v } from "convex/values";
import { creditSource } from "../billing/billing.schema";

export const openingStatus = v.union(v.literal("open"), v.literal("closed"));
export const hackathonStatus = v.union(
	/** Created but not paid for: hidden, not joinable, no start scheduled. */
	v.literal("draft"),
	v.literal("open"),
	v.literal("active"),
	v.literal("closed"),
	v.literal("cancelled"),
);
export const hackathonVerdict = v.union(
	v.literal("passed_with_offer"),
	v.literal("passed"),
	v.literal("not_passed"),
);
export const offerStatus = v.union(
	v.literal("pending"),
	v.literal("accepted"),
	v.literal("declined"),
	v.literal("withdrawn"),
);
export const applicationStatus = v.union(
	v.literal("applied"),
	v.literal("accepted"),
	v.literal("rejected"),
	v.literal("withdrawn"),
	v.literal("left"),
	v.literal("completed"),
);

export const hiringTables = {
	roles: defineTable({
		startupId: v.id("startups"),
		title: v.string(),
		type: v.string(),
		skills: v.array(v.string()),
		description: v.string(),
		location: v.optional(v.string()),
		remote: v.optional(v.boolean()),
		/** Accepted Offers after which the Role is filled and closes. */
		headcount: v.number(),
		status: openingStatus,
		searchText: v.string(),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_status", ["status"])
		.searchIndex("search_roles", {
			searchField: "searchText",
			filterFields: ["status"],
		}),

	hackathons: defineTable({
		startupId: v.id("startups"),
		roleId: v.id("roles"),
		/** The Cycle created with the draft; Starter Tasks and every lane live on it. */
		cycleId: v.id("cycles"),
		title: v.string(),
		description: v.string(),
		maxParticipants: v.number(),
		applicationDeadline: v.optional(v.number()),
		startsAt: v.number(),
		endsAt: v.number(),
		/** Optional prize text, paid off-platform, e.g. "₹5,000 to the winner". */
		prize: v.optional(v.string()),
		/** Optional "More details" a Founder adds to the draft. */
		expectedOutcome: v.optional(v.string()),
		evaluationCriteria: v.optional(v.string()),
		compensation: v.optional(v.string()),
		publishedByUserId: v.optional(v.id("users")),
		/** The credit that paid for publishing; a "rerun" can't earn another re-run credit. */
		creditSource: v.optional(creditSource),
		/** The credit that paid; cancelling before the start un-spends it. */
		creditId: v.optional(v.id("credits")),
		/** When the publishing Founder acknowledged that contributors keep their IP. */
		ipAcknowledgedAt: v.optional(v.number()),
		status: hackathonStatus,
		participantCount: v.number(),
		searchText: v.string(),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_role", ["roleId"])
		.index("by_status", ["status"])
		.searchIndex("search_hackathons", {
			searchField: "searchText",
			filterFields: ["status"],
		}),

	applications: defineTable({
		userId: v.id("users"),
		startupId: v.id("startups"),
		roleId: v.id("roles"),
		hackathonId: v.id("hackathons"),
		status: applicationStatus,
		message: v.optional(v.string()),
		verdict: v.optional(hackathonVerdict),
		evaluation: v.optional(v.string()),
		/** The Participant chose to show the Evaluation on their profile. */
		evaluationPublic: v.optional(v.boolean()),
		/** When the entrant acknowledged the hackathon IP terms. */
		ipAcknowledgedAt: v.optional(v.number()),
		/** A Verdict that earns no Score: the person was on the Startup's team at close (eng review R3). */
		scoreExcluded: v.optional(v.boolean()),
	})
		.index("by_user", ["userId"])
		.index("by_startup", ["startupId"])
		.index("by_role", ["roleId"])
		.index("by_hackathon", ["hackathonId"])
		.index("by_hackathon_and_user", ["hackathonId", "userId"]),

	offers: defineTable({
		applicationId: v.id("applications"),
		hackathonId: v.id("hackathons"),
		roleId: v.id("roles"),
		startupId: v.id("startups"),
		userId: v.id("users"),
		status: offerStatus,
	})
		.index("by_role_and_status", ["roleId", "status"])
		.index("by_user_and_status", ["userId", "status"])
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_hackathon", ["hackathonId"]),

	/** Founder-to-all-Participants news; there are no private Threads. */
	hackathonAnnouncements: defineTable({
		hackathonId: v.id("hackathons"),
		/** The Founder who posted it. */
		userId: v.id("users"),
		body: v.string(),
	}).index("by_hackathon", ["hackathonId"]),
};
