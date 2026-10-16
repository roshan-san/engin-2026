import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { isRunning, phaseOf } from "../shared/hackathonPhase";
import {
	MAX_APPLICATIONS,
	MAX_BOARD_CARDS,
	MAX_LISTED_HACKATHONS,
	MAX_PARTICIPANTS,
} from "../shared/limits";
import type { WaitingReason } from "../shared/places";
import {
	isThreadUnread,
	loadHackathonThreads,
	loadTeamThreads,
	loadThreadRead,
} from "./threads";

/** A decision is in, and the Participant hasn't said whether the promise was kept. */
export function isPromisePending(application: Doc<"applications">): boolean {
	return (
		application.decision !== undefined && application.promiseKept === undefined
	);
}

async function anyUnread(
	ctx: QueryCtx,
	threads: Doc<"threads">[],
	userId: Id<"users">,
): Promise<boolean> {
	for (const thread of threads) {
		const read = await loadThreadRead(ctx, thread._id, userId);
		if (isThreadUnread(thread, read)) {
			return true;
		}
	}
	return false;
}

async function countCardsInReview(
	ctx: QueryCtx,
	startupId: Id<"startups">,
	hackathonId: Id<"hackathons"> | undefined,
): Promise<number> {
	const cards = await ctx.db
		.query("cards")
		.withIndex("by_startup_and_hackathon_and_status", (q) =>
			q
				.eq("startupId", startupId)
				.eq("hackathonId", hackathonId)
				.eq("status", "review"),
		)
		.take(MAX_BOARD_CARDS);
	return cards.length;
}

/** What one of a Founder's Hackathons is waiting on them for, by its status. */
async function hackathonReasons(
	ctx: QueryCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
): Promise<WaitingReason[]> {
	const role = hackathon.job.role;
	const reasons: WaitingReason[] = [];
	const phase = phaseOf(hackathon, Date.now());
	if (phase === "open") {
		const applied = await ctx.db
			.query("applications")
			.withIndex("by_hackathon_and_status", (q) =>
				q.eq("hackathonId", hackathon._id).eq("status", "applied"),
			)
			.take(MAX_APPLICATIONS);
		if (applied.length > 0) {
			reasons.push({ kind: "new_applicants", role, count: applied.length });
		}
	}
	if (phase === "live") {
		const count = await countCardsInReview(
			ctx,
			hackathon.startupId,
			hackathon._id,
		);
		if (count > 0) {
			reasons.push({ kind: "participant_cards_to_review", role, count });
		}
		if (
			await anyUnread(
				ctx,
				await loadHackathonThreads(ctx, hackathon._id),
				userId,
			)
		) {
			reasons.push({ kind: "hackathon_unread", role });
		}
	}
	if (phase === "deciding") {
		const participants = await ctx.db
			.query("applications")
			.withIndex("by_hackathon_and_status", (q) =>
				q.eq("hackathonId", hackathon._id).eq("status", "participating"),
			)
			.take(MAX_PARTICIPANTS);
		const count = participants.filter(
			(application) => application.decision === undefined,
		).length;
		if (count > 0) {
			reasons.push({ kind: "participants_to_decide", role, count });
		}
	}
	return reasons;
}

/** Why a Startup place is waiting on this person. Only a Founder is owed the Board and Hackathons. */
export async function startupReasons(
	ctx: QueryCtx,
	startupId: Id<"startups">,
	userId: Id<"users">,
	isFounder: boolean,
): Promise<WaitingReason[]> {
	const reasons: WaitingReason[] = [];
	if (await anyUnread(ctx, await loadTeamThreads(ctx, startupId), userId)) {
		reasons.push({ kind: "team_unread" });
	}
	if (!isFounder) {
		return reasons;
	}

	const toVerify = await countCardsInReview(ctx, startupId, undefined);
	if (toVerify > 0) {
		reasons.push({ kind: "cards_to_verify", count: toVerify });
	}
	const hackathons = await ctx.db
		.query("hackathons")
		.withIndex("by_startup", (q) => q.eq("startupId", startupId))
		.order("desc")
		.take(MAX_LISTED_HACKATHONS);
	const perHackathon = await Promise.all(
		hackathons
			.filter((hackathon) => isRunning(hackathon.status))
			.map((hackathon) => hackathonReasons(ctx, hackathon, userId)),
	);
	return [...reasons, ...perHackathon.flat()];
}

/** Why a Hackathon the person builds in is waiting on them: Everyone, then their private thread, then the promise. */
export async function participantReasons(
	ctx: QueryCtx,
	application: Doc<"applications">,
): Promise<WaitingReason[]> {
	const { hackathonId, userId } = application;
	const everyone = await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_kind", (q) =>
			q.eq("hackathonId", hackathonId).eq("kind", "everyone"),
		)
		.take(1);
	const priv = await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_participant", (q) =>
			q.eq("hackathonId", hackathonId).eq("participantId", userId),
		)
		.take(1);
	const reasons: WaitingReason[] = [];
	if (await anyUnread(ctx, [...everyone, ...priv], userId)) {
		reasons.push({ kind: "messages_unread" });
	}
	if (isPromisePending(application)) {
		reasons.push({ kind: "promise_pending" });
	}
	return reasons;
}
