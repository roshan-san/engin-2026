import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { type PushPayload, pushPayload } from "./rules";

/** Schedules a push to every device the person allowed, when they have any. */
export async function pushToUser(
	ctx: MutationCtx,
	userId: Id<"users">,
	email: { subject: string; text: string },
): Promise<void> {
	const device = await ctx.db
		.query("pushSubscriptions")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.first();
	if (!device) {
		return;
	}
	const payload: PushPayload = pushPayload(email);
	await ctx.scheduler.runAfter(0, internal.push.send.send, {
		userId,
		...payload,
	});
}
