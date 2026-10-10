import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { requireThreadAccess } from "./access.rules";
import {
	buildMessageViews,
	loadLatestMessages,
	loadPinnedMessages,
	parseMessage,
} from "./messages.rules";
import { markThreadRead } from "./threads.rules";

export const list = query({
	args: { threadId: v.id("threads") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { thread } = await requireThreadAccess(ctx, args.threadId, userId);

		return {
			pinned: await buildMessageViews(
				ctx,
				thread,
				await loadPinnedMessages(ctx, args.threadId),
			),
			messages: await buildMessageViews(
				ctx,
				thread,
				await loadLatestMessages(ctx, args.threadId),
			),
		};
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
		await requireThreadAccess(ctx, args.threadId, userId);
		const { body, images } = parseMessage(args.body, args.images);

		await ctx.db.insert("messages", {
			threadId: args.threadId,
			authorId: userId,
			body,
			images,
			pinned: false,
		});
		await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() });
		await markThreadRead(ctx, args.threadId, userId);
	},
});

export const pin = mutation({
	args: { messageId: v.id("messages"), pinned: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}
		const { thread, isFounder } = await requireThreadAccess(
			ctx,
			message.threadId,
			userId,
		);
		if (!isFounder) {
			throw new Error("Only the Founder can do this");
		}
		if (thread.kind !== "everyone") {
			throw new Error("Only Everyone messages can be pinned");
		}

		await ctx.db.patch(message._id, { pinned: args.pinned });
	},
});
