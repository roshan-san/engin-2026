import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * These URLs mirror the frontend route tree (ADR 0006) and are stored on
 * notifications at write time, so they must stay in step with `src/routes/`.
 */

export const INBOX_HREF = "/inbox";
const MY_PULSES_HREF = "/my-pulses";

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

/** Falls back to `MY_PULSES_HREF` if the Startup no longer exists. */
export async function startupHref(
	ctx: LinkCtx,
	startupId: Id<"startups">,
	section: StartupSection,
): Promise<string> {
	const slug = await slugOf(ctx, startupId);
	return slug ? `/s/${slug}/${section}` : MY_PULSES_HREF;
}

export async function trialCycleHref(
	ctx: LinkCtx,
	trial: Doc<"trialCycles">,
): Promise<string> {
	const slug = await slugOf(ctx, trial.startupId);
	return slug ? `/s/${slug}/trials/${trial._id}` : MY_PULSES_HREF;
}

export async function cycleHref(
	ctx: LinkCtx,
	cycle: Doc<"cycles">,
): Promise<string> {
	const slug = await slugOf(ctx, cycle.startupId);
	return slug ? `/s/${slug}/cycles/${cycle._id}` : MY_PULSES_HREF;
}

export async function pulseHref(
	ctx: LinkCtx,
	pulse: Doc<"pulses">,
): Promise<string> {
	const slug = await slugOf(ctx, pulse.startupId);
	if (!slug) {
		return MY_PULSES_HREF;
	}
	if (pulse.trialCycleId) {
		return `/s/${slug}/trials/${pulse.trialCycleId}`;
	}
	if (pulse.cycleId) {
		return `/s/${slug}/cycles/${pulse.cycleId}`;
	}
	return MY_PULSES_HREF;
}
