import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_ACTIVITY } from "../lib/limits";
import { loadPublicUser } from "../people/users.rules";
import type { activityKind } from "../schema";
import { cycleNumber, weekOf, weekStart } from "./cycles.rules";
import { loadGoal } from "./goals.rules";

type ActivityKind = Infer<typeof activityKind>;

/** The only writer to `activity`, which is append-only. */
export async function appendActivity(
	ctx: MutationCtx,
	entry: {
		startupId: Id<"startups">;
		kind: ActivityKind;
		at: number;
		actorId?: Id<"users">;
		cardId?: Id<"cards">;
		hackathonId?: Id<"hackathons">;
		line?: string;
		selfVerified?: boolean;
	},
): Promise<void> {
	const { at, ...rest } = entry;
	await ctx.db.insert("activity", { ...rest, week: weekOf(at) });
}

/** The newest Activity of a Startup, grouped into Cycles, newest first. */
export async function loadActivityByCycle(
	ctx: QueryCtx,
	startup: Doc<"startups">,
) {
	const rows = await ctx.db
		.query("activity")
		.withIndex("by_startup_and_week", (q) => q.eq("startupId", startup._id))
		.order("desc")
		.take(MAX_ACTIVITY);

	// `desc` keeps each week's rows together, newest first.
	const groups: { week: string; rows: Doc<"activity">[] }[] = [];
	for (const row of rows) {
		const last = groups.at(-1);
		if (last?.week === row.week) {
			last.rows.push(row);
		} else {
			groups.push({ week: row.week, rows: [row] });
		}
	}

	return await Promise.all(
		groups.map(async ({ week, rows }) => ({
			week,
			number: cycleNumber(startup._creationTime, weekStart(week)),
			goal: await loadGoal(ctx, startup._id, week),
			entries: await Promise.all(
				rows.map(async (row) => ({
					kind: row.kind,
					at: row._creationTime,
					actor: await loadPublicUser(ctx, row.actorId),
					line: row.line ?? null,
					selfVerified: row.selfVerified ?? false,
				})),
			),
		})),
	);
}
