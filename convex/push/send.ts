"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

/** Sends one notification to each of the person's devices. Without VAPID keys it does nothing. */
export const send = internalAction({
	args: {
		userId: v.id("users"),
		title: v.string(),
		body: v.string(),
		url: v.string(),
	},
	handler: async (ctx, args) => {
		const publicKey = process.env.VAPID_PUBLIC_KEY;
		const privateKey = process.env.VAPID_PRIVATE_KEY;
		const subject = process.env.VAPID_SUBJECT;
		if (!publicKey || !privateKey || !subject) {
			return;
		}
		const devices = await ctx.runQuery(internal.push.devicesOf, {
			userId: args.userId,
		});
		const { default: webpush } = await import("web-push");
		webpush.setVapidDetails(subject, publicKey, privateKey);
		const payload = JSON.stringify({
			title: args.title,
			body: args.body,
			url: args.url,
		});
		for (const device of devices) {
			try {
				await webpush.sendNotification(
					{
						endpoint: device.endpoint,
						keys: { p256dh: device.p256dh, auth: device.auth },
					},
					payload,
				);
			} catch (error) {
				const status = (error as { statusCode?: number }).statusCode;
				// The browser dropped the subscription: forget the device.
				if (status === 404 || status === 410) {
					await ctx.runMutation(internal.push.forget, {
						endpoint: device.endpoint,
					});
				}
			}
		}
	},
});
