import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_THREAD_MESSAGES } from "../lib/limits";
import { trialCycleHref } from "../lib/links";
import { requireText } from "../lib/text";
import { notify, notifyFounders } from "../people/notifications.rules";
import { loadPublicUser } from "../people/users.rules";
import { listTrialApplications } from "./trialCycles.rules";
import {
	latestMessages,
	requireThreadAccess,
	requireThreadOpen,
	requireTrial,
	requireTrialFounder,
} from "./trialMessages.rules";

function displayName(user: { name: string | null; username: string | null }) {
	return user.name ?? user.username ?? "Someone";
}

/** What one Participant sees: their Thread and the Announcements, oldest first. */
export const list = query({
	args: {
		trialCycleId: v.id("trialCycles"),
		/** Founders name the Participant; Participants may only name themselves. */
		participantUserId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await requireTrial(ctx, args.trialCycleId);
		const access = await requireThreadAccess(
			ctx,
			trial,
			userId,
			args.participantUserId,
		);

		const [thread, announcements] = await Promise.all([
			latestMessages(
				ctx,
				trial._id,
				access.participantUserId,
				MAX_THREAD_MESSAGES,
			),
			latestMessages(ctx, trial._id, undefined, MAX_THREAD_MESSAGES),
		]);
		const messages = [...thread, ...announcements]
			.sort((a, b) => a._creationTime - b._creationTime)
			.slice(-MAX_THREAD_MESSAGES);

		const results = [];
		for (const message of messages) {
			results.push({
				_id: message._id,
				body: message.body,
				createdAt: message._creationTime,
				isAnnouncement: message.participantUserId === undefined,
				user: await loadPublicUser(ctx, message.userId),
			});
		}
		return results;
	},
});

/** Every Participant's Thread in a Trial Cycle with its latest message, for Founders. */
export const threads = query({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await requireTrial(ctx, args.trialCycleId);
		await requireTrialFounder(ctx, trial, userId);

		const summaries = [];
		for (const application of await listTrialApplications(ctx, trial._id)) {
			if (
				application.status !== "joined" &&
				application.status !== "completed"
			) {
				continue;
			}
			const [latest] = await latestMessages(
				ctx,
				trial._id,
				application.userId,
				1,
			);
			summaries.push({
				participantUserId: application.userId,
				user: await loadPublicUser(ctx, application.userId),
				latest: latest
					? {
							body: latest.body,
							createdAt: latest._creationTime,
							fromParticipant: latest.userId === application.userId,
						}
					: null,
			});
		}
		return summaries.sort(
			(a, b) => (b.latest?.createdAt ?? 0) - (a.latest?.createdAt ?? 0),
		);
	},
});

export const send = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		participantUserId: v.optional(v.id("users")),
		body: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await requireTrial(ctx, args.trialCycleId);
		const access = await requireThreadAccess(
			ctx,
			trial,
			userId,
			args.participantUserId,
		);
		requireThreadOpen(trial);
		const body = requireText(args.body, "Message");

		await ctx.db.insert("trialMessages", {
			trialCycleId: trial._id,
			userId,
			participantUserId: access.participantUserId,
			body,
		});

		const sender = await loadPublicUser(ctx, userId);
		const href = await trialCycleHref(ctx, trial);
		if (access.side === "participant") {
			await notifyFounders(ctx, trial.startupId, {
				kind: "message",
				title: `${sender ? displayName(sender) : "A Participant"} sent a message in ${trial.title}`,
				body,
				href,
			});
		} else {
			await notify(ctx, {
				userId: access.participantUserId,
				kind: "message",
				title: `${sender ? displayName(sender) : "A Founder"} replied in ${trial.title}`,
				body,
				href,
			});
		}
	},
});

export const announce = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		body: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await requireTrial(ctx, args.trialCycleId);
		await requireTrialFounder(ctx, trial, userId);
		requireThreadOpen(trial);
		const body = requireText(args.body, "Announcement");

		await ctx.db.insert("trialMessages", {
			trialCycleId: trial._id,
			userId,
			body,
		});

		const href = await trialCycleHref(ctx, trial);
		for (const application of await listTrialApplications(ctx, trial._id)) {
			if (application.status !== "joined") {
				continue;
			}
			await notify(ctx, {
				userId: application.userId,
				kind: "message",
				title: `New announcement in ${trial.title}`,
				body,
				href,
			});
		}
	},
});
