import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { loadParticipants } from "./model";
import { MAX_LISTED_HACKATHONS } from "./rules";

export type HiringRecord = {
	finished: number;
	hires: number;
	promisesKept: number;
	promisesAnswered: number;
	/** Participants left without a decision when the Hackathon closed. */
	undecided: number;
};

type ParticipantTally = Omit<HiringRecord, "finished">;

/** How one Hackathon treated its Participants. */
export function tallyParticipants(
	hackathon: Doc<"hackathons">,
	participants: Doc<"applications">[],
): ParticipantTally {
	const count = (test: (participant: Doc<"applications">) => boolean) =>
		participants.filter(test).length;
	return {
		hires: count((p) => p.decision === "hired"),
		promisesKept: count((p) => p.promiseKept === true),
		promisesAnswered: count((p) => p.promiseKept !== undefined),
		undecided:
			hackathon.status === "done"
				? count((p) => !p.decision || p.decisionMissed === true)
				: 0,
	};
}

/** How a Startup has treated its Participants, across its Hackathons. */
export async function loadHiringRecord(
	ctx: QueryCtx,
	startupId: Id<"startups">,
): Promise<HiringRecord> {
	const hackathons = await ctx.db
		.query("hackathons")
		.withIndex("by_startup", (q) => q.eq("startupId", startupId))
		.take(MAX_LISTED_HACKATHONS);
	const participantLists = await Promise.all(
		hackathons.map((hackathon) => loadParticipants(ctx, hackathon._id)),
	);

	const record: HiringRecord = {
		finished: 0,
		hires: 0,
		promisesKept: 0,
		promisesAnswered: 0,
		undecided: 0,
	};
	for (const [index, hackathon] of hackathons.entries()) {
		const participants = participantLists[index];
		// One nobody joined ended without anyone building, so it proves nothing.
		if (hackathon.status === "done" && participants.length > 0) {
			record.finished += 1;
		}
		const tally = tallyParticipants(hackathon, participants);
		record.hires += tally.hires;
		record.promisesKept += tally.promisesKept;
		record.promisesAnswered += tally.promisesAnswered;
		record.undecided += tally.undecided;
	}
	return record;
}
