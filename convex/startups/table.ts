import { defineTable } from "convex/server";
import { v } from "convex/values";
import { meetings } from "../cycles/lock";
import { trustLevel } from "../momentum/rules";

import { startupCategory, startupCity, startupStage } from "./rules";

export const startupsTables = {
	startups: defineTable({
		name: v.string(),
		slug: v.string(),
		oneLiner: v.optional(v.string()),
		website: v.optional(v.string()),
		logo: v.optional(v.id("_storage")),
		stage: v.optional(startupStage),
		category: v.optional(startupCategory),
		city: v.optional(startupCity),
		/** The one Founder. */
		founderId: v.id("users"),
		momentum: v.number(),
		momentumChange: v.number(),
		/** Active weeks (≥1 verified Card) the weekly run has scored. */
		scoredWeeks: v.number(),
		/** The week key last scored, so a rerun skips the row. */
		scoredThrough: v.optional(v.string()),
		provisional: v.boolean(),
		/** The team's Trust, credit-weighted; absent reads as Low. Set by the weekly run. */
		trust: v.optional(trustLevel),
		/** Verified Cards per finished week, oldest first: at most 12, none before the Startup existed. */
		rhythm: v.array(v.number()),
		/** The team's opening and closing meetings; absent until the Founder sets them. */
		meetings: v.optional(meetings),
	})
		.index("by_slug", ["slug"])
		.index("by_momentum", ["momentum"])
		.index("by_founder", ["founderId"]),
};
