import { defineTable } from "convex/server";
import { v } from "convex/values";

import { inviteStatus } from "../shared/validators";

export const invitesTables = {
	invites: defineTable({
		startupId: v.id("startups"),
		email: v.string(),
		invitedBy: v.id("users"),
		status: inviteStatus,
		expiresAt: v.number(),
		/** Set when the Invite brings a hired Participant onto the Startup. */
		hackathonId: v.optional(v.id("hackathons")),
	})
		.index("by_startup_and_status_and_expiresAt", [
			"startupId",
			"status",
			"expiresAt",
		])
		.index("by_email_and_status_and_expiresAt", [
			"email",
			"status",
			"expiresAt",
		]),
};
