import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_THREADS } from "../shared/limits";
import { loadPublicUser } from "./users";
import { getThreadAccess } from "./threadAccess";

export async function loadThreadRead(
	ctx: QueryCtx | MutationCtx,
	threadId: Id<"threads">,
	userId: Id<"users">,
): Promise<Doc<"threadReads"> | null> {
	return await ctx.db
		.query("threadReads")
		.withIndex("by_thread_and_user", (q) =>
			q.eq("threadId", threadId).eq("userId", userId),
		)
		.unique();
}

/** Whether the thread has a message the person hasn't read. Sending marks your own read. */
export function isThreadUnread(
	thread: Doc<"threads">,
	read: Doc<"threadReads"> | null,
): boolean {
	return (
		thread.lastMessageAt !== undefined &&
		thread.lastMessageAt > (read?.lastReadAt ?? 0)
	);
}

/** Marks everything in the thread as read by this person, as of now. */
export async function markThreadRead(
	ctx: MutationCtx,
	threadId: Id<"threads">,
	userId: Id<"users">,
): Promise<void> {
	const read = await loadThreadRead(ctx, threadId, userId);
	if (read) {
		await ctx.db.patch(read._id, { lastReadAt: Date.now() });
	} else {
		await ctx.db.insert("threadReads", {
			threadId,
			userId,
			lastReadAt: Date.now(),
		});
	}
}

/** The Team thread of a Startup. Hackathon threads belong to the Hackathon. */
export async function loadTeamThreads(
	ctx: QueryCtx,
	startupId: Id<"startups">,
): Promise<Doc<"threads">[]> {
	return await ctx.db
		.query("threads")
		.withIndex("by_startup_and_kind", (q) =>
			q.eq("startupId", startupId).eq("kind", "team"),
		)
		.take(MAX_THREADS);
}

/** A Hackathon's threads: Everyone first, then the private ones. */
export async function loadHackathonThreads(
	ctx: QueryCtx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"threads">[]> {
	const everyone = await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_kind", (q) =>
			q.eq("hackathonId", hackathonId).eq("kind", "everyone"),
		)
		.take(MAX_THREADS);
	const priv = await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_kind", (q) =>
			q.eq("hackathonId", hackathonId).eq("kind", "private"),
		)
		.take(MAX_THREADS);
	return [...everyone, ...priv];
}

/** The threads the person can open, shaped for the list. */
export async function buildThreadViews(
	ctx: QueryCtx,
	threads: Doc<"threads">[],
	userId: Id<"users">,
) {
	const views = [];
	for (const thread of threads) {
		if (!(await getThreadAccess(ctx, thread, userId))) {
			continue;
		}
		const read = await loadThreadRead(ctx, thread._id, userId);
		views.push({
			_id: thread._id,
			kind: thread.kind,
			builder: await loadPublicUser(ctx, thread.builderId),
			lastMessageAt: thread.lastMessageAt ?? null,
			unread: isThreadUnread(thread, read),
		});
	}
	return views;
}
