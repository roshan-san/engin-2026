import { defineTable } from "convex/server";
import { v } from "convex/values";

export const taskStatus = v.union(
	v.literal("todo"),
	v.literal("in_progress"),
	/** A Submitted Task, awaiting a Founder's review. */
	v.literal("review"),
	v.literal("done"),
);
export const proofLinkKind = v.union(
	v.literal("pr"),
	v.literal("commit"),
	v.literal("deploy"),
	v.literal("design"),
	v.literal("doc"),
	v.literal("demo"),
	v.literal("other"),
);
export const proofLink = v.object({ kind: proofLinkKind, url: v.string() });
/** A team's own Cycle, or the one a hackathon owns (its lanes are the Participants). */
export const cycleKind = v.union(v.literal("team"), v.literal("hackathon"));
export const cycleStatus = v.union(
	v.literal("planned"),
	v.literal("active"),
	v.literal("closed"),
);

export const workTables = {
	tasks: defineTable({
		startupId: v.id("startups"),
		cycleId: v.id("cycles"),
		title: v.string(),
		description: v.optional(v.string()),
		status: taskStatus,
		assigneeUserId: v.optional(v.id("users")),
		createdByUserId: v.id("users"),
		proofLinks: v.optional(v.array(proofLink)),
		/** Why a Founder sent a Submitted Task back. */
		reviewNote: v.optional(v.string()),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_cycle", ["cycleId"])
		.index("by_cycle_and_status", ["cycleId", "status"])
		/** A hackathon lane; Starter Task templates have no assignee. */
		.index("by_cycle_and_assignee", ["cycleId", "assigneeUserId"])
		.index("by_assignee", ["assigneeUserId"]),

	cycles: defineTable({
		startupId: v.id("startups"),
		kind: cycleKind,
		title: v.string(),
		/** One line: what the Cycle ships. A hackathon's is its expected outcome, set at publish. */
		goal: v.optional(v.string()),
		/** Set on a hackathon's Cycle, whose status follows the hackathon. */
		hackathonId: v.optional(v.id("hackathons")),
		startAt: v.number(),
		endAt: v.number(),
		status: cycleStatus,
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_startup_and_kind_and_status", ["startupId", "kind", "status"]),

	/** Members (not Founders, who belong to every Cycle implicitly) added to a Cycle. */
	cycleMembers: defineTable({
		cycleId: v.id("cycles"),
		userId: v.id("users"),
	})
		.index("by_cycle_and_user", ["cycleId", "userId"])
		.index("by_cycle", ["cycleId"]),
};
