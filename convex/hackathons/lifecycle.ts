import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { appendActivity } from "../activity/model";
import { releaseIfUnconfirmed } from "../applications/model";
import { publishBlockFor, publishBlockMessage } from "../billing/rules";
import {
	loadHackathonCardsInReview,
	loadParticipants,
	loadPlanView,
} from "./model";
import { canStartAt, MAX_APPLICATIONS, START_MESSAGE } from "./rules";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Not selected emails sent per scheduled batch. */
const EMAIL_BATCH = 50;

// Every write to a Hackathon's `status` lives here. Explicit return types: this file
// schedules `internal.hackathons`, whose handlers call back into it, so inference would loop.

/** Opens a draft for applications, when the Founder's plan allows, and schedules each step after it. The caller checks `founderId` is the Founder. */
export async function publish(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	founderId: Id<"users">,
): Promise<void> {
	if (hackathon.status !== "draft") {
		throw new ConvexError("Already published");
	}
	if (!canStartAt(hackathon.startsAt, Date.now())) {
		throw new ConvexError(START_MESSAGE);
	}
	const block = publishBlockFor(await loadPlanView(ctx, founderId));
	if (block) {
		throw new ConvexError(publishBlockMessage(block));
	}
	await ctx.db.patch(hackathon._id, {
		status: "open",
		publishedAt: Date.now(),
	});
	await ctx.db.insert("threads", {
		startupId: hackathon.startupId,
		hackathonId: hackathon._id,
		kind: "everyone",
	});
	await scheduleSteps(ctx, hackathon);
}

/**
 * Schedules each step of a published Hackathon at its dates. Editing the dates
 * calls this again; each step checks its own time, so the old ones do nothing.
 */
export async function scheduleSteps(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	await ctx.scheduler.runAt(hackathon.startsAt, internal.hackathons.goLive, {
		hackathonId: hackathon._id,
	});
	await ctx.scheduler.runAt(
		hackathon.endsAt,
		internal.hackathons.startDeciding,
		{ hackathonId: hackathon._id },
	);
	await ctx.scheduler.runAt(
		hackathon.decideBy,
		internal.hackathons.closeDeciding,
		{ hackathonId: hackathon._id },
	);
	const dayBefore = (at: number) => Math.max(at - DAY_MS, Date.now());
	await ctx.scheduler.runAt(
		dayBefore(hackathon.startsAt),
		internal.email.remindStart,
		{ hackathonId: hackathon._id },
	);
	await ctx.scheduler.runAt(
		dayBefore(hackathon.decideBy),
		internal.email.remindDecision,
		{ hackathonId: hackathon._id },
	);
}

/** At `startsAt`: declines everyone not picked and gives each Participant their Cards. */
export async function goLive(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	if (hackathon?.status !== "open" || Date.now() < hackathon.startsAt) {
		return;
	}

	await declineAppliedBatch(ctx, hackathon._id);
	for (const participant of await loadParticipants(ctx, hackathon._id)) {
		await releaseIfUnconfirmed(ctx, participant, hackathon);
	}

	const participants = await loadParticipants(ctx, hackathon._id);
	if (participants.length === 0) {
		// Nobody to build with: nothing was built, so there is nothing to log,
		// and the Hackathon goes back on the Founder's plan.
		await ctx.db.patch(hackathon._id, {
			publishedAt: undefined,
			returnedToPlan: true,
		});
		await finish(ctx, hackathon, { log: false });
		return;
	}
	await ctx.db.patch(hackathon._id, { status: "live" });
	for (const participant of participants) {
		await ctx.scheduler.runAfter(0, internal.hackathons.copyCardsFor, {
			hackathonId: hackathon._id,
			userId: participant.userId,
		});
	}
}

/** Declines the rest of the applicants not picked, once the Hackathon is past open. */
export async function declineApplied(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	if (
		!hackathon ||
		hackathon.status === "draft" ||
		hackathon.status === "open"
	) {
		return;
	}
	await declineAppliedBatch(ctx, hackathon._id);
}

/**
 * Declines one batch of applicants still `applied`. Applications are unlimited,
 * so a full batch schedules the next.
 */
async function declineAppliedBatch(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const applied = await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathonId).eq("status", "applied"),
		)
		.take(MAX_APPLICATIONS);
	for (const application of applied) {
		await ctx.db.patch(application._id, { status: "declined" });
	}
	// Emailing up to 500 in this transaction is too much; small batches go out after it.
	for (let i = 0; i < applied.length; i += EMAIL_BATCH) {
		await ctx.scheduler.runAfter(0, internal.email.notSelected, {
			hackathonId,
			userIds: applied
				.slice(i, i + EMAIL_BATCH)
				.map((application) => application.userId),
		});
	}
	if (applied.length === MAX_APPLICATIONS) {
		await ctx.scheduler.runAfter(0, internal.hackathons.declineApplied, {
			hackathonId,
		});
	}
}

/** At `endsAt`. */
export async function startDeciding(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	if (hackathon?.status !== "live" || Date.now() < hackathon.endsAt) {
		return;
	}
	await ctx.db.patch(hackathon._id, { status: "deciding" });
}

/**
 * At `decideBy` the Hackathon closes: anyone undecided gets Not this time, marked as
 * a missed decision, and any Card still in Review stays unverified.
 */
export async function closeDeciding(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	if (
		(hackathon?.status !== "live" && hackathon?.status !== "deciding") ||
		Date.now() < hackathon.decideBy
	) {
		return;
	}
	for (const participant of await loadParticipants(ctx, hackathon._id)) {
		if (!participant.decision) {
			await ctx.db.patch(participant._id, {
				decision: "not_this_time",
				decisionMissed: true,
			});
		}
	}
	await finish(ctx, hackathon, { log: true });
}

/** Ends the Hackathon once every Participant has a decision and no Card waits in Review. Call after each decision and each review. */
export async function finishIfDecided(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	if (hackathon.status !== "deciding" && hackathon.status !== "live") {
		return;
	}
	const participants = await loadParticipants(ctx, hackathon._id);
	if (
		participants.length === 0 ||
		participants.some((participant) => !participant.decision)
	) {
		return;
	}
	if ((await loadHackathonCardsInReview(ctx, hackathon._id)).length > 0) {
		return;
	}
	await finish(ctx, hackathon, { log: true });
}

/** `finishIfDecided` for the Hackathon a just-reviewed Card belongs to, if any. */
export async function finishAfterReview(
	ctx: MutationCtx,
	card: Doc<"cards">,
): Promise<void> {
	const hackathon = card.hackathonId && (await ctx.db.get(card.hackathonId));
	if (hackathon) {
		await finishIfDecided(ctx, hackathon);
	}
}

/** Marks the Hackathon done, once, and logs it on the Startup's Activity when `log` is set. */
async function finish(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	{ log }: { log: boolean },
): Promise<void> {
	if (hackathon.status === "done") {
		return;
	}
	await ctx.db.patch(hackathon._id, { status: "done", finishedAt: Date.now() });
	if (log) {
		await appendActivity(ctx, {
			startupId: hackathon.startupId,
			kind: "hackathon_finished",
			at: Date.now(),
			hackathonId: hackathon._id,
		});
	}
}
