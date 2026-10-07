import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { requireText } from "../lib/text";
import { loadPublicUser } from "../people/users.rules";
import { requireFounderMembership } from "../teams/membership.rules";
import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import {
	announceToHackathon,
	buildThread,
	loadLatestAnnouncements,
	loadThreadHackathons,
	requireAnnouncementReader,
	requireAnnouncementsOpen,
	requireHackathon,
	pickThreads,
} from "./announcements.rules";

async function toAnnouncements(ctx: QueryCtx, hackathon: Doc<"hackathons">) {
	const results = [];
	for (const announcement of await loadLatestAnnouncements(
		ctx,
		hackathon._id,
	)) {
		results.push({
			_id: announcement._id,
			body: announcement.body,
			createdAt: announcement._creationTime,
			user: await loadPublicUser(ctx, announcement.userId),
		});
	}
	return results;
}

/** A Hackathon's Announcements, newest first. */
export const list = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await requireHackathon(ctx, args.hackathonId);
		await requireAnnouncementReader(ctx, hackathon, userId);

		return await toAnnouncements(ctx, hackathon);
	},
});

/** One thread per Hackathon the user reads Announcements of, newest activity first. */
export const listThreads = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);

		const threads = [];
		for (const hackathon of await loadThreadHackathons(ctx, userId)) {
			threads.push(await buildThread(ctx, hackathon));
		}
		return pickThreads(threads);
	},
});

/** A thread opened: the Hackathon's heading and its Announcements, read-only. */
export const getThread = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await requireHackathon(ctx, args.hackathonId);
		await requireAnnouncementReader(ctx, hackathon, userId);

		const thread = await buildThread(ctx, hackathon);
		return {
			title: thread.title,
			status: thread.status,
			startupName: thread.startupName,
			href: thread.href,
			announcements: await toAnnouncements(ctx, hackathon),
		};
	},
});

export const post = mutation({
	args: {
		hackathonId: v.id("hackathons"),
		body: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await requireHackathon(ctx, args.hackathonId);
		await requireFounderMembership(ctx, hackathon.startupId, userId);
		requireAnnouncementsOpen(hackathon);
		const body = requireText(args.body, "Announcement");

		await ctx.db.insert("hackathonAnnouncements", {
			hackathonId: hackathon._id,
			userId,
			body,
		});
		await announceToHackathon(ctx, hackathon, userId, body);
	},
});
