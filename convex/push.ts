import { v } from "convex/values";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { MAX_DEVICES } from "./push/rules";

/** The VAPID public key the browser subscribes with; null until push is set up. */
export const publicKey = query({
	args: {},
	handler: async () => process.env.VAPID_PUBLIC_KEY ?? null,
});

/** Whether this device's subscription is stored for you. */
export const isSubscribed = query({
	args: { endpoint: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const device = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.unique();
		return device?.userId === userId;
	},
});

/** Saves this browser for notifications. A device signed in as someone else moves to you. */
export const subscribe = mutation({
	args: {
		endpoint: v.string(),
		keys: v.object({ p256dh: v.string(), auth: v.string() }),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const existing = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.unique();
		const fields = {
			userId,
			endpoint: args.endpoint,
			p256dh: args.keys.p256dh,
			auth: args.keys.auth,
		};
		if (existing) {
			await ctx.db.replace(existing._id, fields);
			return;
		}
		const devices = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(MAX_DEVICES);
		if (devices.length >= MAX_DEVICES) {
			await ctx.db.delete(devices[0]._id);
		}
		await ctx.db.insert("pushSubscriptions", fields);
	},
});

/** Stops notifications on this browser. */
export const unsubscribe = mutation({
	args: { endpoint: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const device = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.unique();
		if (device?.userId === userId) {
			await ctx.db.delete(device._id);
		}
	},
});

export const devicesOf = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) =>
		await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.take(MAX_DEVICES),
});

export const forget = internalMutation({
	args: { endpoint: v.string() },
	handler: async (ctx, args) => {
		const device = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.unique();
		if (device) {
			await ctx.db.delete(device._id);
		}
	},
});
