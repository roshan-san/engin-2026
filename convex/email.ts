import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { emailNotSelected } from "./email/model";
import * as reminders from "./email/reminders";

/** The unsubscribe link: opts its address out of every engin email. False for an unknown token. */
export const unsubscribe = internalMutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const prefs = await ctx.db
			.query("emailPrefs")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.unique();
		if (!prefs) {
			return false;
		}
		await ctx.db.patch(prefs._id, { optedOut: true });
		return true;
	},
});

export const remindStart = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		await reminders.remindStart(ctx, args.hackathonId);
	},
});

export const remindDecision = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		await reminders.remindDecision(ctx, args.hackathonId);
	},
});

/** Daily, 09:00 IST. */
export const newApplicantsDigest = internalMutation({
	args: {},
	handler: async (ctx) => {
		await reminders.newApplicantsDigest(ctx);
	},
});

/** Monday, 12:00 IST; pages through every startup. */
export const mondayReminders = internalMutation({
	args: { cursor: v.optional(v.string()) },
	handler: async (ctx, args): Promise<void> => {
		const next = await reminders.mondayReminders(ctx, args.cursor ?? null);
		if (next) {
			await ctx.scheduler.runAfter(0, internal.email.mondayReminders, {
				cursor: next,
			});
		}
	},
});

/** "Not selected for this one" for a batch of Applicants the start passed over. */
export const notSelected = internalMutation({
	args: { hackathonId: v.id("hackathons"), userIds: v.array(v.id("users")) },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			return;
		}
		for (const userId of args.userIds) {
			await emailNotSelected(ctx, hackathon, userId);
		}
	},
});
