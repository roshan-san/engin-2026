import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import {
	buildMessageViews,
	emailLateMessage,
	loadLatestMessages,
	loadPinnedMessages,
	parseMessage,
	postMessage,
} from "./messages/model";
import { requireThreadAccess, requireThreadOpen } from "./threads/access";

export const list = query({
	args: { threadId: v.id("threads") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { thread } = await requireThreadAccess(ctx, args.threadId, userId);

		const [pinned, messages] = await Promise.all(
			[loadPinnedMessages, loadLatestMessages].map(async (load) =>
				buildMessageViews(ctx, thread, await load(ctx, args.threadId)),
			),
		);
		return { pinned, messages };
	},
});

export const send = mutation({
	args: {
		threadId: v.id("threads"),
		body: v.string(),
		images: v.optional(v.array(v.id("_storage"))),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { thread } = await requireThreadAccess(ctx, args.threadId, userId);
		await requireThreadOpen(ctx, thread);
		const message = parseMessage(args.body, args.images);
		await postMessage(ctx, args.threadId, userId, message);
		await emailLateMessage(ctx, thread, userId, message.body);
	},
});

export const pin = mutation({
	args: { messageId: v.id("messages"), pinned: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new ConvexError("Message not found");
		}
		const { thread, isFounder } = await requireThreadAccess(
			ctx,
			message.threadId,
			userId,
		);
		await requireThreadOpen(ctx, thread);
		if (!isFounder) {
			throw new ConvexError("Only the Founder can do this");
		}
		if (thread.kind !== "everyone") {
			throw new ConvexError("Only Everyone messages can be pinned");
		}

		await ctx.db.patch(message._id, { pinned: args.pinned });
	},
});
