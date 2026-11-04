import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getApplication } from "../applications/model";
import { getTeamRole } from "../startups/team";
import { isThreadOpen } from "./rules";

type Ctx = QueryCtx | MutationCtx;

type ThreadAccess = { thread: Doc<"threads">; isFounder: boolean };

/**
 * The thread when the person may open it, else null. Team: the team.
 * Everyone: the Founder and Builders. Private: the Founder and that Applicant or Builder.
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
	if ((await getTeamRole(ctx, startup._id, userId)) === "founder") {
		return { thread, isFounder: true };
	}
	if (
		!thread.hackathonId ||
		(thread.kind === "private" && thread.participantId !== userId)
	) {
		return null;
	}

	const application = await getApplication(ctx, thread.hackathonId, userId);
	const allowed =
		thread.kind === "private"
			? application !== null
			: application?.status === "participating";
	return allowed ? { thread, isFounder: false } : null;
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

/** Throws once `isThreadOpen` says the thread no longer takes messages, or its Applicant was declined. */
export async function requireThreadOpen(ctx: Ctx, thread: Doc<"threads">) {
	if (!thread.hackathonId) {
		return;
	}
	const hackathon = await ctx.db.get(thread.hackathonId);
	if (hackathon && !isThreadOpen(thread.kind, hackathon, Date.now())) {
		throw new ConvexError("This Hackathon has ended.");
	}
	if (thread.kind === "private" && thread.participantId) {
		const application = await getApplication(
			ctx,
			thread.hackathonId,
			thread.participantId,
		);
		if (application?.status === "declined") {
			throw new ConvexError("This conversation is closed");
		}
	}
}
