import { defineTable } from "convex/server";
import { v } from "convex/values";

import { threadKind } from "../shared/validators";

export const chatTables = {
	threads: defineTable({
		startupId: v.id("startups"),
		hackathonId: v.optional(v.id("hackathons")),
		kind: threadKind,
		/** The Participant a private Thread belongs to. */
		participantId: v.optional(v.id("users")),
		lastMessageAt: v.optional(v.number()),
	})
		.index("by_startup_and_kind", ["startupId", "kind"])
		.index("by_hackathon_and_kind", ["hackathonId", "kind"])
		.index("by_hackathon_and_participant", ["hackathonId", "participantId"]),

	messages: defineTable({
		threadId: v.id("threads"),
		authorId: v.id("users"),
		body: v.string(),
		images: v.array(v.id("_storage")),
		pinned: v.boolean(),
	})
		.index("by_thread", ["threadId"])
		.index("by_thread_and_pinned", ["threadId", "pinned"]),

	threadReads: defineTable({
		threadId: v.id("threads"),
		userId: v.id("users"),
		lastReadAt: v.number(),
	})
		.index("by_thread_and_user", ["threadId", "userId"])
		.index("by_user", ["userId"]),
};
