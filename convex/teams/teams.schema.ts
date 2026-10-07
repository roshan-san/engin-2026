import { defineTable } from "convex/server";
import { v } from "convex/values";

export const memberRole = v.union(v.literal("founder"), v.literal("member"));
export const startupStage = v.union(
	v.literal("idea"),
	v.literal("pre-seed"),
	v.literal("seed"),
	v.literal("series-a"),
	v.literal("growth"),
);
export const inviteStatus = v.union(
	v.literal("pending"),
	v.literal("accepted"),
	v.literal("declined"),
	v.literal("expired"),
);
export const activityKind = v.union(
	v.literal("member_joined"),
	v.literal("member_removed"),
	v.literal("cycle_started"),
	v.literal("cycle_closed"),
	v.literal("task_verified"),
	v.literal("role_posted"),
	v.literal("hackathon_published"),
	v.literal("hackathon_started"),
	v.literal("hackathon_closed"),
	v.literal("hackathon_starter_task_added"),
	v.literal("hackathon_starter_task_removed"),
	v.literal("hackathon_announcement_posted"),
	v.literal("offer_accepted"),
);

export const teamsTables = {
	startups: defineTable({
		name: v.string(),
		slug: v.string(),
		tagline: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		stage: v.optional(startupStage),
		website: v.optional(v.string()),
		twitterUrl: v.optional(v.string()),
		linkedinUrl: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
		problem: v.optional(v.string()),
		solution: v.optional(v.string()),
		product: v.optional(v.string()),
		traction: v.optional(v.string()),
		teamBlurb: v.optional(v.string()),
		techStack: v.optional(v.array(v.string())),
		location: v.optional(v.string()),
		remote: v.optional(v.boolean()),
		isPublic: v.boolean(),
		searchText: v.string(),
	})
		.index("by_slug", ["slug"])
		.index("by_public", ["isPublic"])
		.searchIndex("search_startups", {
			searchField: "searchText",
			filterFields: ["isPublic"],
		}),

	memberships: defineTable({
		startupId: v.id("startups"),
		userId: v.id("users"),
		role: memberRole,
	})
		.index("by_startup_and_user", ["startupId", "userId"])
		.index("by_user", ["userId"])
		.index("by_startup", ["startupId"])
		.index("by_startup_and_role", ["startupId", "role"]),

	invites: defineTable({
		startupId: v.id("startups"),
		email: v.string(),
		role: memberRole,
		token: v.string(),
		invitedByUserId: v.id("users"),
		status: inviteStatus,
		expiresAt: v.number(),
	})
		.index("by_token", ["token"])
		.index("by_email", ["email"])
		.index("by_startup_and_email", ["startupId", "email"])
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"]),

	activity: defineTable({
		startupId: v.id("startups"),
		kind: activityKind,
		cycleId: v.optional(v.id("cycles")),
		taskId: v.optional(v.id("tasks")),
		roleId: v.optional(v.id("roles")),
		hackathonId: v.optional(v.id("hackathons")),
		summary: v.string(),
	}).index("by_startup", ["startupId"]),
};
