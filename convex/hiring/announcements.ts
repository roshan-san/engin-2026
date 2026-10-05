import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { requireText } from "../lib/text";
import { loadPublicUser } from "../people/users.rules";
import { requireFounderMembership } from "../teams/membership.rules";
import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import {
	announceToTrial,
	buildThread,
	loadLatestAnnouncements,
	loadThreadTrials,
	requireAnnouncementReader,
	requireAnnouncementsOpen,
	requireTrial,
	pickThreads,
} from "./announcements.rules";

async function toAnnouncements(ctx: QueryCtx, trial: Doc<"trialCycles">) {
	const results = [];
	for (const announcement of await loadLatestAnnouncements(ctx, trial._id)) {
		results.push({
			_id: announcement._id,
			body: announcement.body,
			createdAt: announcement._creationTime,
			user: await loadPublicUser(ctx, announcement.userId),
		});
	}
	return results;
}

/** A Trial Cycle's Announcements, newest first. */
export const list = query({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await requireTrial(ctx, args.trialCycleId);
		await requireAnnouncementReader(ctx, trial, userId);

		return await toAnnouncements(ctx, trial);
	},
});

/** One thread per Trial Cycle the user reads Announcements of, newest activity first. */
export const listThreads = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);

		const threads = [];
		for (const trial of await loadThreadTrials(ctx, userId)) {
			threads.push(await buildThread(ctx, trial));
		}
		return pickThreads(threads);
	},
});

/** A thread opened: the Trial Cycle's heading and its Announcements, read-only. */
export const getThread = query({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await requireTrial(ctx, args.trialCycleId);
		await requireAnnouncementReader(ctx, trial, userId);

		const thread = await buildThread(ctx, trial);
		return {
			title: thread.title,
			status: thread.status,
			startupName: thread.startupName,
			href: thread.href,
			announcements: await toAnnouncements(ctx, trial),
		};
	},
});

export const post = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		body: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await requireTrial(ctx, args.trialCycleId);
		await requireFounderMembership(ctx, trial.startupId, userId);
		requireAnnouncementsOpen(trial);
		const body = requireText(args.body, "Announcement");

		await ctx.db.insert("trialAnnouncements", {
			trialCycleId: trial._id,
			userId,
			body,
		});
		await announceToTrial(ctx, trial, userId, body);
	},
});
