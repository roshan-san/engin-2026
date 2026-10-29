import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { appendActivity } from "../activity/model";
import { publishBlockFor, publishBlockMessage } from "../billing/rules";
import { MAX_APPLICATIONS } from "../shared/limits";
import { loadParticipants, loadPlanView } from "./model";

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
	if (hackathon.startsAt <= Date.now()) {
		throw new ConvexError("Start on a coming Monday");
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
}

/** At `startsAt`: declines everyone not picked and gives each Participant their Cards. */
export async function goLive(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	if (hackathon?.status !== "open") {
		return;
	}

	await declineAppliedBatch(ctx, hackathon._id);

	const participants = await loadParticipants(ctx, hackathon._id);
	if (participants.length === 0) {
		// Nobody to build with: nothing was built, so there is nothing to log.
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
	if (hackathon?.status !== "live") {
		return;
	}
	await ctx.db.patch(hackathon._id, { status: "deciding" });
}

/** At `decideBy` the Hackathon closes; Participants still undecided stay that way. */
export async function closeDeciding(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	if (hackathon?.status !== "live" && hackathon?.status !== "deciding") {
		return;
	}
	await finish(ctx, hackathon, { log: true });
}

/** Ends the Hackathon once every Participant has a decision. Call after each decision. */
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
	await finish(ctx, hackathon, { log: true });
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
	await ctx.db.patch(hackathon._id, { status: "done" });
	if (log) {
		await appendActivity(ctx, {
			startupId: hackathon.startupId,
			kind: "hackathon_finished",
			at: Date.now(),
			hackathonId: hackathon._id,
		});
	}
}
