import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_PARTICIPANTS } from "../shared/limits";
import { appendActivity } from "./activity";
import { declineAppliedBatch } from "./hackathons";

// Every write to a Hackathon's `status` lives here. Explicit return types: this file
// schedules `internal.hiring.hackathons`, whose handlers call back into it, so inference would loop.

/** Opens a draft for applications and schedules each step after it. The caller checks the Founder and billing. */
export async function publish(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	await ctx.db.patch(hackathon._id, {
		status: "open",
		publishedAt: Date.now(),
	});
	await ctx.db.insert("threads", {
		startupId: hackathon.startupId,
		hackathonId: hackathon._id,
		kind: "everyone",
	});
	await ctx.scheduler.runAt(
		hackathon.startsAt,
		internal.hiring.hackathons.goLive,
		{ hackathonId: hackathon._id },
	);
	await ctx.scheduler.runAt(
		hackathon.endsAt,
		internal.hiring.hackathons.startDeciding,
		{ hackathonId: hackathon._id },
	);
	await ctx.scheduler.runAt(
		hackathon.decideBy,
		internal.hiring.hackathons.closeDeciding,
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

	if (await declineAppliedBatch(ctx, hackathon._id)) {
		await ctx.scheduler.runAfter(0, internal.hiring.hackathons.declineApplied, {
			hackathonId: hackathon._id,
		});
	}

	const participants = await loadParticipants(ctx, hackathon._id);
	if (participants.length === 0) {
		// Nobody to build with: nothing was built, so there is nothing to log.
		await finish(ctx, hackathon, { log: false });
		return;
	}
	await ctx.db.patch(hackathon._id, { status: "live" });
	for (const participant of participants) {
		await ctx.scheduler.runAfter(0, internal.hiring.hackathons.copyCardsFor, {
			hackathonId: hackathon._id,
			userId: participant.userId,
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

async function loadParticipants(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"applications">[]> {
	return await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathonId).eq("status", "participating"),
		)
		.take(MAX_PARTICIPANTS);
}
