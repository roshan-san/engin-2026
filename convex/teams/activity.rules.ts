import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { activityKind } from "../schema";

type ActivityKind = Infer<typeof activityKind>;

type LogActivityArgs = {
	startupId: Id<"startups">;
	kind: ActivityKind;
	summary: string;
	cycleId?: Id<"cycles">;
	pulseId?: Id<"pulses">;
	roleId?: Id<"roles">;
	trialCycleId?: Id<"trialCycles">;
};

/** Append-only Activity record, alongside notify() at the same call sites. */
export async function logActivity(ctx: MutationCtx, args: LogActivityArgs) {
	await ctx.db.insert("activity", args);
}
