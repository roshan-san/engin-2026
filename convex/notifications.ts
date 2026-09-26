import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const FEED_SIZE = 30;

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);

		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.take(FEED_SIZE);

		return {
			notifications: notifications.map((notification) => ({
				_id: notification._id,
				kind: notification.kind,
				title: notification.title,
				body: notification.body ?? null,
				href: notification.href ?? null,
				createdAt: notification._creationTime,
				isRead: notification.readAt !== undefined,
			})),
			unreadCount: notifications.filter((n) => n.readAt === undefined).length,
		};
	},
});

export const markRead = mutation({
	args: { notificationId: v.id("notifications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const notification = await ctx.db.get(args.notificationId);

		if (!notification || notification.userId !== userId) {
			throw new Error("Notification not found");
		}
		if (notification.readAt !== undefined) {
			return;
		}

		await ctx.db.patch(args.notificationId, { readAt: Date.now() });
	},
});

export const markAllRead = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const now = Date.now();

		const unread = await ctx.db
			.query("notifications")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.take(FEED_SIZE);

		for (const notification of unread) {
			if (notification.readAt === undefined) {
				await ctx.db.patch(notification._id, { readAt: now });
			}
		}
	},
});
