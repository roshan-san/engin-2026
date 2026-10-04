import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_STARTUP_FOUNDERS } from "../lib/limits";
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

/** Co-founders have equal powers, so Founder-facing news goes to all of them. */
export async function notifyFounders(
	ctx: MutationCtx,
	startupId: Id<"startups">,
	notification: Notification,
	options: { except?: Id<"users"> } = {},
): Promise<void> {
	const founders = await ctx.db
		.query("memberships")
		.withIndex("by_startup_and_role", (q) =>
			q.eq("startupId", startupId).eq("role", "founder"),
		)
		.take(MAX_STARTUP_FOUNDERS);
	for (const founder of founders) {
		if (founder.userId !== options.except) {
			await notify(ctx, { ...notification, userId: founder.userId });
		}
	}
}
