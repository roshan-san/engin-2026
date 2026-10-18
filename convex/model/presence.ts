import { Presence } from "@convex-dev/presence";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	MAX_BOARD_CARDS,
	MAX_PRESENCE_INTERVAL_MS,
	MIN_PRESENCE_INTERVAL_MS,
	TEXT,
} from "../shared/limits";
import { requireLimitedText } from "./text";

export const presence = new Presence(components.presence);

/** A tab's session id and heartbeat interval, checked before they are stored. */
export function parseHeartbeat(args: { sessionId: string; interval: number }) {
	const sessionId = requireLimitedText(
		args.sessionId,
		"Session",
		TEXT.sessionId,
	);
	if (
		!Number.isFinite(args.interval) ||
		args.interval < MIN_PRESENCE_INTERVAL_MS ||
		args.interval > MAX_PRESENCE_INTERVAL_MS
	) {
		throw new ConvexError("Heartbeat interval is out of range");
	}
	return { sessionId, interval: args.interval };
}

type Ctx = QueryCtx | MutationCtx;

export type WorkingOn = { cardId: Id<"cards">; title: string };

/** Each person's newest In progress Card on the Startup's Board. */
export async function loadWorkingOn(
	ctx: Ctx,
	startupId: Id<"startups">,
): Promise<Map<Id<"users">, WorkingOn>> {
	const cards = await ctx.db
		.query("cards")
		.withIndex("by_startup_and_hackathon_and_status_and_verifiedAt", (q) =>
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
