import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { loadHackathonCardsInReview } from "../cards/model";
import { loadParticipants, loadRunningHackathons } from "../hackathons/model";
import { phaseOf } from "../hackathons/rules";
import {
	MAX_APPLICATIONS,
	MAX_BOARD_CARDS,
	MAX_LISTED_HACKATHONS,
	MAX_USER_APPLICATIONS,
} from "../shared/limits";
import type { WaitingReason } from "../shared/places";
import { loadLogoUrl } from "../startups/model";
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

async function countStartupCardsInReview(
	ctx: QueryCtx,
	startupId: Id<"startups">,
): Promise<number> {
	const cards = await ctx.db
		.query("cards")
		.withIndex("by_startup_and_hackathon_and_status_and_verifiedAt", (q) =>
			q
				.eq("startupId", startupId)
				.eq("hackathonId", undefined)
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
		const count = (await loadHackathonCardsInReview(ctx, hackathon._id)).length;
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
		const participants = await loadParticipants(ctx, hackathon._id);
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

	const toVerify = await countStartupCardsInReview(ctx, startupId);
	if (toVerify > 0) {
		reasons.push({ kind: "cards_to_verify", count: toVerify });
	}
	const running = await loadRunningHackathons(
		ctx,
		startupId,
		MAX_LISTED_HACKATHONS,
	);
	const perHackathon = await Promise.all(
		running
			.sort((a, b) => b._creationTime - a._creationTime)
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

/**
 * The Hackathons the person builds in or applied to. A finished Hackathon stays
 * until its Participant answers the promise question; applications leave when it ends.
 */
export async function loadHackathonPlaces(ctx: QueryCtx, userId: Id<"users">) {
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);

	const loaded = await Promise.all(
		applications.map(async (application) => {
			const hackathon = await ctx.db.get(application.hackathonId);
			const shown =
				hackathon &&
				(hackathon.status !== "done" ||
					(application.status === "participating" &&
						isPromisePending(application)));
			const startup = shown ? await ctx.db.get(hackathon.startupId) : null;
			if (!hackathon || !startup) {
				return { building: null, applied: null };
			}
			const place = {
				hackathonId: hackathon._id,
				job: hackathon.job,
				startupName: startup.name,
				startupSlug: startup.slug,
				startupLogoUrl: await loadLogoUrl(ctx, startup),
			};
			if (application.status !== "participating") {
				return {
					building: null,
					applied: { ...place, status: application.status },
				};
			}
			return {
				building: {
					...place,
					status: hackathon.status,
					startsAt: hackathon.startsAt,
					endsAt: hackathon.endsAt,
					decision: application.decision ?? null,
					waiting: await participantReasons(ctx, application),
				},
				applied: null,
			};
		}),
	);
	return {
		hackathons: loaded.flatMap(({ building }) => (building ? [building] : [])),
		applied: loaded.flatMap(({ applied }) => (applied ? [applied] : [])),
	};
}
