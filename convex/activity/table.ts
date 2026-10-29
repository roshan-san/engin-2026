import { defineTable } from "convex/server";
import { v } from "convex/values";

import { activityKind } from "../shared/validators";

export const activityTables = {
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
