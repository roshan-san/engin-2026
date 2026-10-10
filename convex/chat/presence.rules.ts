import { Presence } from "@convex-dev/presence";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_BOARD_CARDS } from "../lib/limits";

export const presence = new Presence(components.presence);

type Ctx = QueryCtx | MutationCtx;

export type WorkingOn = { cardId: Id<"cards">; title: string };

/** Each person's newest In progress Card on the Startup's Board. */
export async function loadWorkingOn(
	ctx: Ctx,
	startupId: Id<"startups">,
): Promise<Map<Id<"users">, WorkingOn>> {
	const cards = await ctx.db
		.query("cards")
		.withIndex("by_startup_and_hackathon_and_status", (q) =>
			q
				.eq("startupId", startupId)
				.eq("hackathonId", undefined)
				.eq("status", "in_progress"),
		)
		.order("desc")
		.take(MAX_BOARD_CARDS);

	const workingOn = new Map<Id<"users">, WorkingOn>();
	for (const card of cards) {
		if (card.ownerId && !workingOn.has(card.ownerId)) {
			workingOn.set(card.ownerId, { cardId: card._id, title: card.title });
		}
	}
	return workingOn;
}
