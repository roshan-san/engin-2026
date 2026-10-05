import { defineTable } from "convex/server";
import { v } from "convex/values";

export const pulseStatus = v.union(
	v.literal("todo"),
	v.literal("in_progress"),
	/** A Submitted Pulse, awaiting a Founder's review. */
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
export const cycleStatus = v.union(
	v.literal("planned"),
	v.literal("active"),
	v.literal("closed"),
);

export const workTables = {
	pulses: defineTable({
		startupId: v.id("startups"),
		cycleId: v.optional(v.id("cycles")),
		trialCycleId: v.optional(v.id("trialCycles")),
		title: v.string(),
		description: v.optional(v.string()),
		status: pulseStatus,
		assigneeUserId: v.optional(v.id("users")),
		createdByUserId: v.id("users"),
		proofLinks: v.optional(v.array(proofLink)),
		/** Owner of the Board a trial Pulse is on. */
		participantUserId: v.optional(v.id("users")),
		/** Why a Founder sent a Submitted Pulse back. */
		reviewNote: v.optional(v.string()),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_cycle", ["cycleId"])
		.index("by_trial", ["trialCycleId"])
		.index("by_trial_and_participant", ["trialCycleId", "participantUserId"])
		.index("by_assignee", ["assigneeUserId"]),

	cycles: defineTable({
		startupId: v.id("startups"),
		title: v.string(),
		startAt: v.number(),
		endAt: v.number(),
		status: cycleStatus,
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"]),

	/** Members (not Founders, who belong to every Cycle implicitly) added to a Cycle. */
	cycleMembers: defineTable({
		cycleId: v.id("cycles"),
		userId: v.id("users"),
	})
		.index("by_cycle_and_user", ["cycleId", "userId"])
		.index("by_cycle", ["cycleId"]),
};
