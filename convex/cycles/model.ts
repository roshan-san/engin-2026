import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	type BoardState,
	boardState,
	cardWeek,
	type Meetings,
	weekOf,
} from "./rules";

type Ctx = QueryCtx | MutationCtx;

export type WeekContext = {
	meetings: Meetings | undefined;
	isSolo: boolean;
	/** The week new Cards join, and the one being planned while locked. */
	week: string;
	state: BoardState;
	/** The `cycleWeeks` row for `week`, if any. */
	row: Doc<"cycleWeeks"> | null;
};

export async function loadWeekRow(
	ctx: Ctx,
	startupId: Id<"startups">,
	week: string,
): Promise<Doc<"cycleWeeks"> | null> {
	return await ctx.db
		.query("cycleWeeks")
		.withIndex("by_startup_and_week", (q) =>
			q.eq("startupId", startupId).eq("week", week),
		)
		.unique();
}

/** Where the Startup's week stands at `now`: which week Cards join, and whether the Board is locked. */
export async function loadWeekContext(
	ctx: Ctx,
	startup: Doc<"startups">,
	now: number,
): Promise<WeekContext> {
	const contributor = await ctx.db
		.query("contributors")
		.withIndex("by_startup_and_user", (q) => q.eq("startupId", startup._id))
		.first();
	const isSolo = contributor === null;
	const meetings = startup.meetings;
	const week = cardWeek(now, meetings, isSolo);
	const row = await loadWeekRow(ctx, startup._id, week);
	const thisWeek = weekOf(now);
	const thisWeekRow =
		thisWeek === week ? row : await loadWeekRow(ctx, startup._id, thisWeek);
	const state = boardState({
		now,
		meetings,
		isSolo,
		startedWeek: thisWeekRow?.startedAt !== undefined,
	});
	return { meetings, isSolo, week, state, row };
}
