import { defineTable } from "convex/server";
import { v } from "convex/values";

import { activityKind, cardStatus, shipped } from "../shared/validators";

export const workTables = {
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

	/** Append-only; written only through `appendActivity`. */
	activity: defineTable({
		startupId: v.id("startups"),
		kind: activityKind,
		/** ISO week key, `YYYY-Www`. */
		week: v.string(),
		actorId: v.optional(v.id("users")),
		cardId: v.optional(v.id("cards")),
		hackathonId: v.optional(v.id("hackathons")),
		line: v.optional(v.string()),
		selfVerified: v.optional(v.boolean()),
	})
		.index("by_startup_and_week", ["startupId", "week"])
		.index("by_startup_and_kind_and_week", ["startupId", "kind", "week"])
		.index("by_actor_and_kind_and_selfVerified_and_week", [
			"actorId",
			"kind",
			"selfVerified",
			"week",
		]),
};
