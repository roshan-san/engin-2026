import { type Infer, type ObjectType, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { refundPublishCredit } from "../billing/credits.rules";
import {
	GOAL_MAX,
	HACKATHON_TEXT_LIMITS,
	MAX_HACKATHON_APPLICATIONS,
	MAX_HACKATHON_PARTICIPANTS,
} from "../lib/limits";
import { hackathonHref } from "../lib/links";
import { buildSearchText, limitText, requireLimitedText } from "../lib/text";
import { notify, notifyFounders } from "../people/notifications.rules";
import type { cycleStatus, hackathonStatus, hackathonVerdict } from "../schema";
import { seedLanes } from "./starterTasks.rules";

type HackathonCtx = QueryCtx | MutationCtx;
type HackathonStatus = Infer<typeof hackathonStatus>;

/** A hackathon's Cycle is Planned until it runs, and Closed once it ends either way. */
const CYCLE_STATUS: Record<HackathonStatus, Infer<typeof cycleStatus>> = {
	draft: "planned",
	open: "planned",
	active: "active",
	closed: "closed",
	cancelled: "closed",
};

/**
 * The one place a hackathon's status changes after `create`: its Cycle moves
 * with it, so the two never disagree.
 */
export async function setHackathonStatus(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	status: HackathonStatus,
): Promise<void> {
	await ctx.db.patch(hackathon._id, { status });
	await ctx.db.patch(hackathon.cycleId, { status: CYCLE_STATUS[status] });
}

/**
 * Inserts a draft with its Cycle in one step. The Cycle goes in first because
 * the hackathon requires its id; the Cycle then gets the hackathon's.
 */
export async function insertDraftHackathon(
	ctx: MutationCtx,
	startupId: Id<"startups">,
	fields: ReturnType<typeof buildDraftFields>,
): Promise<Id<"hackathons">> {
	const cycleId = await ctx.db.insert("cycles", {
		startupId,
		kind: "hackathon",
		title: fields.title,
		startAt: fields.startsAt,
		endAt: fields.endsAt,
		status: CYCLE_STATUS.draft,
	});
	const hackathonId = await ctx.db.insert("hackathons", {
		startupId,
		cycleId,
		...fields,
		status: "draft",
		participantCount: 0,
	});
	await ctx.db.patch(cycleId, { hackathonId });
	return hackathonId;
}

/** Keeps the Cycle's title and dates in step with an edited or rescheduled draft. */
export async function syncHackathonCycle(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	fields: { title?: string; startsAt: number; endsAt: number },
): Promise<void> {
	await ctx.db.patch(hackathon.cycleId, {
		...(fields.title !== undefined && { title: fields.title }),
		startAt: fields.startsAt,
		endAt: fields.endsAt,
	});
}

/** Everything a Founder sets on a draft; `create` and `update` both take all of it. */
export const draftFields = {
	roleId: v.id("roles"),
	title: v.string(),
	description: v.string(),
	maxParticipants: v.number(),
	startsAt: v.number(),
	endsAt: v.number(),
	applicationDeadline: v.optional(v.number()),
	prize: v.optional(v.string()),
	expectedOutcome: v.optional(v.string()),
	evaluationCriteria: v.optional(v.string()),
	compensation: v.optional(v.string()),
	starterTasks: v.array(
		v.object({ title: v.string(), description: v.optional(v.string()) }),
	),
};

export type DraftInput = ObjectType<typeof draftFields>;

/**
 * The stored draft fields, trimmed and bounded. Optional fields left out come
 * back `undefined`, so a patch clears them.
 */
export function buildDraftFields(input: DraftInput, role: Doc<"roles">) {
	const title = requireLimitedText(
		input.title,
		"Title",
		HACKATHON_TEXT_LIMITS.title,
	);
	const description = requireLimitedText(
		input.description,
		"Description",
		HACKATHON_TEXT_LIMITS.description,
	);
	return {
		roleId: role._id,
		title,
		description,
		maxParticipants: Math.min(
			MAX_HACKATHON_PARTICIPANTS,
			Math.max(1, Math.floor(input.maxParticipants)),
		),
		startsAt: input.startsAt,
		endsAt: input.endsAt,
		applicationDeadline: input.applicationDeadline,
		prize: limitText(input.prize, "Prize", HACKATHON_TEXT_LIMITS.prize),
		// It becomes the Cycle's one-line goal at publish.
		expectedOutcome: limitText(
			input.expectedOutcome,
			"Expected outcome",
			GOAL_MAX,
		),
		evaluationCriteria: limitText(
			input.evaluationCriteria,
			"Evaluation criteria",
			HACKATHON_TEXT_LIMITS.detail,
		),
		compensation: limitText(
			input.compensation,
			"Compensation",
			HACKATHON_TEXT_LIMITS.detail,
		),
		searchText: buildSearchText(title, description, role.title),
	};
}

export function isPassed(
	verdict: Infer<typeof hackathonVerdict> | undefined,
): boolean {
	return verdict === "passed" || verdict === "passed_with_offer";
}

export async function requireHackathon(
	ctx: HackathonCtx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"hackathons">> {
	const hackathon = await ctx.db.get(hackathonId);
	if (!hackathon) {
		throw new Error("Hackathon not found");
	}
	return hackathon;
}

export async function getHackathonApplication(
	ctx: HackathonCtx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
) {
	return await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_user", (q) =>
			q.eq("hackathonId", hackathonId).eq("userId", userId),
		)
		.unique();
}

export async function listHackathonApplications(
	ctx: HackathonCtx,
	hackathonId: Id<"hackathons">,
) {
	return await ctx.db
		.query("applications")
		.withIndex("by_hackathon", (q) => q.eq("hackathonId", hackathonId))
		.take(MAX_HACKATHON_APPLICATIONS);
}

export function isHackathonLive(hackathon: Doc<"hackathons">): boolean {
	return hackathon.status === "open" || hackathon.status === "active";
}

/**
 * A hackathon anyone may read: published, and its Startup isn't in stealth.
 * Drafts, stealth and missing all come back `null`, so they look the same.
 */
export async function loadPublicHackathon(
	ctx: HackathonCtx,
	hackathonId: Id<"hackathons">,
) {
	const hackathon = await ctx.db.get(hackathonId);
	if (!hackathon || hackathon.status === "draft") {
		return null;
	}
	const startup = await ctx.db.get(hackathon.startupId);
	if (!startup?.isPublic) {
		return null;
	}
	return { hackathon, startup };
}

/**
 * One schedule rule for create, update and reschedule: the end follows the
 * start, the start is ahead, and a deadline (if set) falls between now and the start.
 */
export function requireValidSchedule(
	schedule: {
		startsAt: number;
		endsAt: number;
		applicationDeadline?: number;
	},
	now: number,
): void {
	if (schedule.endsAt <= schedule.startsAt) {
		throw new Error("Hackathon end must be after start");
	}
	if (schedule.startsAt <= now) {
		throw new Error("Pick a start time in the future");
	}
	const deadline = schedule.applicationDeadline;
	if (deadline === undefined) {
		return;
	}
	if (deadline <= now) {
		throw new Error("Pick an application deadline in the future");
	}
	if (deadline > schedule.startsAt) {
		throw new Error("The application deadline must be before the start");
	}
}

/** The Role a hackathon is for: it belongs to this Startup and is still open. */
export async function requireOpenRoleOf(
	ctx: HackathonCtx,
	startupId: Id<"startups">,
	roleId: Id<"roles">,
): Promise<Doc<"roles">> {
	const role = await ctx.db.get(roleId);
	if (!role || role.startupId !== startupId) {
		throw new Error("Role not found");
	}
	if (role.status !== "open") {
		throw new Error("This Role is closed");
	}
	return role;
}

/** Entry closes at the application deadline, or at the start when none is set. */
export function requireAcceptingEntries(hackathon: Doc<"hackathons">) {
	if (hackathon.status === "draft") {
		throw new Error("This hackathon isn't published yet");
	}
	const entryClosesAt = hackathon.applicationDeadline ?? hackathon.startsAt;
	if (hackathon.status !== "open" || Date.now() > entryClosesAt) {
		throw new Error("This Hackathon is no longer accepting people");
	}
}

/** Ends a Hackathon without Verdicts; carries no Score consequence. */
export async function cancelHackathon(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	reason?: string,
): Promise<void> {
	await refundPublishCredit(ctx, hackathon);
	await setHackathonStatus(ctx, hackathon, "cancelled");

	const href = await hackathonHref(ctx, hackathon);
	for (const application of await listHackathonApplications(
		ctx,
		hackathon._id,
	)) {
		if (application.status !== "accepted" && application.status !== "applied") {
			continue;
		}
		await notify(ctx, {
			userId: application.userId,
			kind: "hackathon",
			title: `${hackathon.title} was cancelled`,
			body: reason,
			href,
		});
	}
}

/**
 * Runs at the start time: pending applications are rejected, then the Hackathon
 * Cycle either becomes active or, with nobody in it, is cancelled.
 */
export async function startHackathon(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	const applications = await listHackathonApplications(ctx, hackathon._id);
	const href = await hackathonHref(ctx, hackathon);

	for (const application of applications) {
		if (application.status !== "applied") {
			continue;
		}
		await ctx.db.patch(application._id, { status: "rejected" });
		await notify(ctx, {
			userId: application.userId,
			kind: "application",
			title: `${hackathon.title} started without your application being accepted`,
			href,
		});
	}

	if (hackathon.participantCount === 0) {
		await setHackathonStatus(ctx, hackathon, "cancelled");
		await notifyFounders(ctx, hackathon.startupId, {
			kind: "hackathon",
			title: `${hackathon.title} was cancelled: nobody joined`,
			href,
		});
		return;
	}

	await setHackathonStatus(ctx, hackathon, "active");
	const participants = applications.filter(
		(application) => application.status === "accepted",
	);
	await seedLanes(
		ctx,
		hackathon,
		participants.map((application) => application.userId),
	);
	for (const application of participants) {
		await notify(ctx, {
			userId: application.userId,
			kind: "hackathon",
			title: `${hackathon.title} has started`,
			href,
		});
	}
}

export async function isHackathonParticipant(
	ctx: HackathonCtx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<boolean> {
	const application = await getHackathonApplication(ctx, hackathonId, userId);
	return application?.status === "accepted";
}
