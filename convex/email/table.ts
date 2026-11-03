import { defineTable } from "convex/server";
import { v } from "convex/values";
import { emailKind } from "./rules";

export const emailTables = {
	/** Every email engin sent, or would have without a Resend key. */
	emails: defineTable({
		to: v.string(),
		kind: emailKind,
		subject: v.string(),
		text: v.string(),
		/** Timed emails carry one, so a retry never sends twice. */
		dedupeKey: v.optional(v.string()),
		/** `queued` once handed to Resend; `logged` when no key is set. */
		status: v.union(v.literal("logged"), v.literal("queued")),
	})
		.index("by_to", ["to"])
		.index("by_dedupeKey", ["dedupeKey"]),

	/** One per address: its unsubscribe token, and whether it opted out. */
	emailPrefs: defineTable({
		email: v.string(),
		token: v.string(),
		optedOut: v.boolean(),
	})
		.index("by_email", ["email"])
		.index("by_token", ["token"]),
};
