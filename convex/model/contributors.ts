import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { STARTING_RATING, WEEK_COUNT_CAP } from "../shared/limits";
import { isProvisional, type PublicUser, toPublicUser } from "./users";
import { weekOf } from "../shared/cycles";

export type TeamPerson = PublicUser & {
	rating: number;
	ratingChange: number;
	isProvisional: boolean;
	verifiedThisCycle: number;
};

/** A person on the Team tab: who they are, their Rating, and what they shipped this Cycle. */
export function toTeamPerson(
	user: Doc<"users">,
	verifiedThisCycle: number,
): TeamPerson {
	return {
		...toPublicUser(user),
		rating: user.rating ?? STARTING_RATING,
		ratingChange: user.ratingChange ?? 0,
		isProvisional: isProvisional(user),
		verifiedThisCycle,
	};
}

/** This Cycle's verified Cards of the Startup per owner (`actorId`), Self-verified included. */
export async function loadVerifiedThisCycle(
	ctx: QueryCtx,
	startupId: Id<"startups">,
	now: number,
): Promise<Map<Id<"users">, number>> {
	const rows = await ctx.db
		.query("activity")
		.withIndex("by_startup_and_kind_and_week", (q) =>
			q
				.eq("startupId", startupId)
				.eq("kind", "card_verified")
				.eq("week", weekOf(now)),
		)
		.take(WEEK_COUNT_CAP);

	const counts = new Map<Id<"users">, number>();
	for (const row of rows) {
		if (row.actorId) {
			counts.set(row.actorId, (counts.get(row.actorId) ?? 0) + 1);
		}
	}
	return counts;
}
