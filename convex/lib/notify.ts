import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { notificationKind } from "../schema";

type NotificationKind = Infer<typeof notificationKind>;

type Notification = {
	kind: NotificationKind;
	title: string;
	body?: string;
	href?: string;
};

export async function notify(
	ctx: MutationCtx,
	notification: Notification & { userId: Id<"users"> },
): Promise<void> {
	await ctx.db.insert("notifications", notification);
}

export async function notifyFounder(
	ctx: MutationCtx,
	startupId: Id<"startups">,
	notification: Notification,
): Promise<void> {
	const startup = await ctx.db.get(startupId);
	if (startup) {
		await notify(ctx, { ...notification, userId: startup.founderUserId });
	}
}
