import { defineTable } from "convex/server";
import { v } from "convex/values";

import {
	startupCategory,
	startupCity,
	startupStage,
} from "../shared/validators";

export const startupsTables = {
	startups: defineTable({
		name: v.string(),
		slug: v.string(),
		oneLiner: v.optional(v.string()),
		website: v.optional(v.string()),
		logo: v.optional(v.id("_storage")),
		stage: startupStage,
		category: startupCategory,
		city: startupCity,
		/** The one Founder. */
		founderId: v.id("users"),
		rating: v.number(),
		ratingChange: v.number(),
		/** Active weeks (≥1 verified Card) the weekly run has rated. */
		ratedWeeks: v.number(),
		/** The week key last rated, so a rerun skips the row. */
		ratedThrough: v.optional(v.string()),
		provisional: v.boolean(),
		/** Verified Cards per finished week, oldest first: at most 12, none before the Startup existed. */
		rhythm: v.array(v.number()),
	})
		.index("by_slug", ["slug"])
		.index("by_rating", ["rating"])
		.index("by_founder", ["founderId"]),
};
