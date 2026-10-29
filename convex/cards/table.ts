import { defineTable } from "convex/server";
import { v } from "convex/values";

import { cardStatus, shipped } from "../shared/validators";

export const cardsTables = {
	cards: defineTable({
		startupId: v.id("startups"),
		/** Set on a Hackathon Card, which lives on a Participant's board. */
		hackathonId: v.optional(v.id("hackathons")),
		ownerId: v.optional(v.id("users")),
		title: v.string(),
		notes: v.string(),
		notesEditedAt: v.optional(v.number()),
		notesEditedBy: v.optional(v.id("users")),
		status: cardStatus,
		shipped: v.optional(shipped),
		submittedAt: v.optional(v.number()),
		verifiedAt: v.optional(v.number()),
		verifiedBy: v.optional(v.id("users")),
	})
		// Open Cards have no `verifiedAt`, so the prefix serves them too.
		.index("by_startup_and_hackathon_and_status_and_verifiedAt", [
			"startupId",
			"hackathonId",
			"status",
			"verifiedAt",
		])
		.index("by_hackathon_and_owner", ["hackathonId", "ownerId"])
		.index("by_hackathon_and_status", ["hackathonId", "status"]),
};
