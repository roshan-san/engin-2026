import { defineTable } from "convex/server";
import { v } from "convex/values";

export const messagesTables = {
	messages: defineTable({
		threadId: v.id("threads"),
		authorId: v.id("users"),
		body: v.string(),
		images: v.array(v.id("_storage")),
		pinned: v.boolean(),
	})
		.index("by_thread", ["threadId"])
		.index("by_thread_and_pinned", ["threadId", "pinned"]),
};
