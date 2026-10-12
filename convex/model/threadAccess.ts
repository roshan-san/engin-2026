import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getTeamRole } from "./teamAccess";

type Ctx = QueryCtx | MutationCtx;

type ThreadAccess = { thread: Doc<"threads">; isFounder: boolean };

/**
 * The thread when the person may open it, else null. Team: the team.
 * Everyone: the Founder and Builders. Private: the Founder and that Builder.
 */
export async function getThreadAccess(
	ctx: Ctx,
	thread: Doc<"threads">,
	userId: Id<"users">,
): Promise<ThreadAccess | null> {
	if (thread.kind === "team") {
		const role = await getTeamRole(ctx, thread.startupId, userId);
		return role ? { thread, isFounder: role === "founder" } : null;
	}

	const startup = await ctx.db.get(thread.startupId);
	if (!startup) {
		return null;
	}
	if (startup.founderId === userId) {
		return { thread, isFounder: true };
	}
	if (
		!thread.hackathonId ||
		(thread.kind === "private" && thread.builderId !== userId)
	) {
		return null;
	}

	const hackathonId = thread.hackathonId;
	const application = await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_user", (q) =>
			q.eq("hackathonId", hackathonId).eq("userId", userId),
		)
		.unique();
	return application?.status === "building"
		? { thread, isFounder: false }
		: null;
}

export async function requireThreadAccess(
	ctx: Ctx,
	threadId: Id<"threads">,
	userId: Id<"users">,
): Promise<ThreadAccess> {
	const thread = await ctx.db.get(threadId);
	const access = thread ? await getThreadAccess(ctx, thread, userId) : null;
	if (!access) {
		throw new ConvexError("You can't open this thread");
	}
	return access;
}

/** A done Hackathon's threads are read-only; Team threads never lock. */
export async function requireThreadOpen(ctx: Ctx, thread: Doc<"threads">) {
	if (!thread.hackathonId) {
		return;
	}
	const hackathon = await ctx.db.get(thread.hackathonId);
	if (hackathon?.status === "done") {
		throw new ConvexError("This Hackathon has ended.");
	}
}
