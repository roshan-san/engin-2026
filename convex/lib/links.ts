import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * These URLs mirror the frontend route tree (ADR 0006) and are stored on
 * notifications at write time, so they must stay in step with `src/routes/`.
 */

export const INBOX_HREF = "/inbox";
const MY_TASKS_HREF = "/my-tasks";

type StartupSection =
	| "cycles"
	| "hiring"
	| "team"
	| "pitch"
	| "activity"
	| "settings";

type LinkCtx = QueryCtx | MutationCtx;

async function slugOf(
	ctx: LinkCtx,
	startupId: Id<"startups">,
): Promise<string | null> {
	return (await ctx.db.get(startupId))?.slug ?? null;
}

/** Falls back to `MY_TASKS_HREF` if the Startup no longer exists. */
export async function startupHref(
	ctx: LinkCtx,
	startupId: Id<"startups">,
	section: StartupSection,
): Promise<string> {
	const slug = await slugOf(ctx, startupId);
	return slug ? `/s/${slug}/${section}` : MY_TASKS_HREF;
}

export async function hackathonHref(
	ctx: LinkCtx,
	hackathon: Doc<"hackathons">,
): Promise<string> {
	const slug = await slugOf(ctx, hackathon.startupId);
	return slug ? `/s/${slug}/hackathons/${hackathon._id}` : MY_TASKS_HREF;
}

export async function cycleHref(
	ctx: LinkCtx,
	cycle: Doc<"cycles">,
): Promise<string> {
	const slug = await slugOf(ctx, cycle.startupId);
	return slug ? `/s/${slug}/cycles/${cycle._id}` : MY_TASKS_HREF;
}

export async function taskHref(
	ctx: LinkCtx,
	task: Doc<"tasks">,
): Promise<string> {
	const slug = await slugOf(ctx, task.startupId);
	if (!slug) {
		return MY_TASKS_HREF;
	}
	// A hackathon's Cycle is opened from its hackathon.
	const cycle = await ctx.db.get(task.cycleId);
	if (cycle?.hackathonId) {
		return `/s/${slug}/hackathons/${cycle.hackathonId}`;
	}
	return `/s/${slug}/cycles/${task.cycleId}`;
}
