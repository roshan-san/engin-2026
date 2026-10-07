import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
	LIVE_ENTRY_STATUSES,
	MAX_LIVE_ENTRIES,
	MAX_HACKATHON_APPLICATIONS,
	MAX_USER_APPLICATIONS,
} from "../lib/limits";
import { getMembership } from "../teams/membership.rules";
import {
	getHackathonApplication,
	isHackathonLive,
	listHackathonApplications,
} from "./hackathons.rules";

export const TEAM_ENTRY_MESSAGE =
	"You're on this startup's team, so you can't enter its hackathon";
export const ONE_ATTEMPT_MESSAGE =
	"You get one attempt per Hackathon. Look for a later one for this Role.";
export const LIVE_ENTRY_LIMIT_MESSAGE = `You're in ${MAX_LIVE_ENTRIES} hackathons already. Finish or withdraw from one to join another.`;
export const HACKATHON_FULL_MESSAGE = "This Hackathon is full";

/** An entry holds one of the person's live-entry slots while its hackathon is live. */
export function holdsLiveEntry(
	application: Doc<"applications">,
	hackathon: Doc<"hackathons"> | null,
): boolean {
	return (
		(LIVE_ENTRY_STATUSES as readonly string[]).includes(application.status) &&
		hackathon !== null &&
		isHackathonLive(hackathon)
	);
}

async function countLiveEntries(ctx: MutationCtx, userId: Id<"users">) {
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);

	let count = 0;
	for (const application of applications) {
		const hackathon = await ctx.db.get(application.hackathonId);
		if (holdsLiveEntry(application, hackathon)) {
			count += 1;
		}
	}
	return count;
}

/**
 * Nobody enters their own startup's hackathon (Score integrity, eng review
 * R3), everyone gets one attempt per Hackathon, and nobody holds more than
 * 5 live entries.
 */
export async function requireCanEnter(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
): Promise<void> {
	if (await getMembership(ctx, hackathon.startupId, userId)) {
		throw new Error(TEAM_ENTRY_MESSAGE);
	}
	if (await getHackathonApplication(ctx, hackathon._id, userId)) {
		throw new Error(ONE_ATTEMPT_MESSAGE);
	}
	if ((await countLiveEntries(ctx, userId)) >= MAX_LIVE_ENTRIES) {
		throw new Error(LIVE_ENTRY_LIMIT_MESSAGE);
	}
}

/**
 * A hackathon is full for new applications once its Participant spots are
 * taken or it has 50 applications of any status, so the Founders' applicant
 * list (read up to the same bound) never hides anyone.
 */
export async function requireRoomToApply(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	if (hackathon.participantCount >= hackathon.maxParticipants) {
		throw new Error(HACKATHON_FULL_MESSAGE);
	}
	const applications = await listHackathonApplications(ctx, hackathon._id);
	if (applications.length >= MAX_HACKATHON_APPLICATIONS) {
		throw new Error(HACKATHON_FULL_MESSAGE);
	}
}

/** Takes a Participant spot; the counter changes in the same mutation as the status. */
export async function takeParticipantSpot(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	if (hackathon.participantCount >= hackathon.maxParticipants) {
		throw new Error(HACKATHON_FULL_MESSAGE);
	}
	await ctx.db.patch(hackathon._id, {
		participantCount: hackathon.participantCount + 1,
	});
}

export async function releaseParticipantSpot(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	await ctx.db.patch(hackathon._id, {
		participantCount: Math.max(0, hackathon.participantCount - 1),
	});
}
