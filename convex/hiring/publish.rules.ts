import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { spendCredit } from "../billing/credits.rules";
import { GOAL_MAX } from "../lib/limits";
import { hackathonHref } from "../lib/links";
import { limitText } from "../lib/text";
import { notifyFounders } from "../people/notifications.rules";
import { logActivity } from "../teams/activity.rules";
import { requireFounderMembership } from "../teams/membership.rules";
import { setHackathonStatus } from "./hackathons.rules";
import { loadStarterTasks } from "./starterTasks.rules";

/** The publish dialog matches these to offer the fix (new dates, edit). */
export const NEW_DATES_MESSAGE =
	"This hackathon's start or application deadline has passed. Pick new dates, then publish.";
export const NO_STARTER_TASK_MESSAGE =
	"Add at least one Starter Task before publishing";
export const NO_EXPECTED_OUTCOME_MESSAGE =
	"Add an expected outcome before publishing";

/**
 * Why a draft can't be published now, or null when it can. Checks run in the
 * eng review's C4 order; the Founder check is the caller's.
 */
export async function publishProblem(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	now: number,
): Promise<string | null> {
	if (hackathon.status !== "draft") {
		return "Only a draft can be published";
	}
	const startup = await ctx.db.get(hackathon.startupId);
	if (!startup?.isPublic) {
		return "Turn off stealth mode before publishing a public hackathon";
	}
	const role = await ctx.db.get(hackathon.roleId);
	if (role?.status !== "open") {
		return "This Role is closed";
	}
	if ((await loadStarterTasks(ctx, hackathon)).length === 0) {
		return NO_STARTER_TASK_MESSAGE;
	}
	if (!hackathon.expectedOutcome) {
		return NO_EXPECTED_OUTCOME_MESSAGE;
	}
	const entryClosesAt = hackathon.applicationDeadline ?? hackathon.startsAt;
	if (hackathon.startsAt <= now || entryClosesAt <= now) {
		return NEW_DATES_MESSAGE;
	}
	return null;
}

export async function requirePublishable(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
	now: number,
): Promise<void> {
	await requireFounderMembership(ctx, hackathon.startupId, userId);
	const problem = await publishProblem(ctx, hackathon, now);
	if (problem) {
		throw new Error(problem);
	}
}

/**
 * The charge point: spends one of the Founder's credits, opens the hackathon,
 * schedules its start and tells the other co-founders. Run
 * `requirePublishable` first.
 */
export async function publishDraft(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
	now: number,
): Promise<void> {
	const credit = await spendCredit(ctx, userId, hackathon._id, now);
	await ctx.db.patch(hackathon._id, {
		publishedByUserId: userId,
		creditSource: credit.source,
		creditId: credit._id,
	});
	await setHackathonStatus(ctx, hackathon, "open");
	// The expected outcome is the Cycle's goal; drafts cap it at GOAL_MAX already.
	await ctx.db.patch(hackathon.cycleId, {
		goal: limitText(hackathon.expectedOutcome, "Goal", GOAL_MAX),
	});
	await ctx.scheduler.runAt(
		hackathon.startsAt,
		internal.hiring.hackathons.start,
		{
			hackathonId: hackathon._id,
		},
	);
	await notifyFounders(
		ctx,
		hackathon.startupId,
		{
			kind: "hackathon",
			title: `${hackathon.title} is published`,
			href: await hackathonHref(ctx, hackathon),
		},
		{ except: userId },
	);
	await logActivity(ctx, {
		startupId: hackathon.startupId,
		kind: "hackathon_published",
		hackathonId: hackathon._id,
		summary: `Hackathon "${hackathon.title}" published`,
	});
}
