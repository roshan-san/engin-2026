import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { loadConversationRows, loadConversations } from "./conversations/model";
import {
	CONVERSATION_TEXT,
	MAX_WEEK_CONVERSATIONS,
} from "./conversations/rules";
import { weekOf } from "./cycles/rules";
import { requireUserId } from "./lib/auth";
import { requireLimitedText } from "./lib/text";
import { requireTeam } from "./startups/team";

export const listCurrent = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireTeam(ctx, args.startupId, userId);

		return await loadConversations(ctx, args.startupId, weekOf(Date.now()));
	},
});

export const add = mutation({
	args: { startupId: v.id("startups"), line: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireTeam(ctx, args.startupId, userId);
		const line = requireLimitedText(
			args.line,
			"Conversation",
			CONVERSATION_TEXT.line,
		);

		const week = weekOf(Date.now());
		const rows = await loadConversationRows(ctx, args.startupId, week);
		if (rows.length >= MAX_WEEK_CONVERSATIONS) {
			throw new ConvexError(
				`This week already has ${MAX_WEEK_CONVERSATIONS} conversations`,
			);
		}
		await ctx.db.insert("conversations", {
			startupId: args.startupId,
			week,
			authorId: userId,
			line,
		});
	},
});

export const remove = mutation({
	args: { conversationId: v.id("conversations") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const row = await ctx.db.get(args.conversationId);
		if (!row) {
			return;
		}
		const { role } = await requireTeam(ctx, row.startupId, userId);
		if (role !== "founder" && row.authorId !== userId) {
			throw new ConvexError("Only its author or the Founder can remove this");
		}

		await ctx.db.delete(row._id);
	},
});
