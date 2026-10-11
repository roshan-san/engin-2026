import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_BUILDERS, MAX_LISTED_HACKATHONS } from "../lib/limits";

export type HiringRecord = {
	finished: number;
	hires: number;
	promisesKept: number;
	promisesAnswered: number;
	/** Builders still waiting on a decision after `decideBy`. */
	undecided: number;
};

/** How a Startup has treated its Builders, across its Hackathons. */
export async function loadHiringRecord(
	ctx: QueryCtx,
	startupId: Id<"startups">,
	now: number,
): Promise<HiringRecord> {
	const record: HiringRecord = {
		finished: 0,
		hires: 0,
		promisesKept: 0,
		promisesAnswered: 0,
		undecided: 0,
	};
	const hackathons = await ctx.db
		.query("hackathons")
		.withIndex("by_startup", (q) => q.eq("startupId", startupId))
		.take(MAX_LISTED_HACKATHONS);

	for (const hackathon of hackathons) {
		if (hackathon.status === "done") {
			record.finished += 1;
		}
		const builders = await ctx.db
			.query("applications")
			.withIndex("by_hackathon_and_status", (q) =>
				q.eq("hackathonId", hackathon._id).eq("status", "building"),
			)
			.take(MAX_BUILDERS);
		for (const builder of builders) {
			if (builder.decision === "hired") {
				record.hires += 1;
			}
			if (builder.promiseKept !== undefined) {
				record.promisesAnswered += 1;
			}
			if (builder.promiseKept) {
				record.promisesKept += 1;
			}
			if (!builder.decision && hackathon.decideBy < now) {
				record.undecided += 1;
			}
		}
	}
	return record;
}
