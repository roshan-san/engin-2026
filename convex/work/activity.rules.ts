import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { activityKind } from "../schema";
import { weekOf } from "./cycles.rules";

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
