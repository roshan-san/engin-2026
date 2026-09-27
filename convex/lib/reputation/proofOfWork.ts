import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import { MAX_USER_PULSES } from "../limits";

type WorkCounts = { verifiedPulses: number; cyclesCompleted: number };

/**
 * Internal work behind a profile: Verified Pulses and the closed Cycles they
 * shipped in. Visible evidence only; it never changes Score (ADR 0002). Work at
 * private Startups is collapsed into one anonymous total.
 */
export async function loadProofOfWork(ctx: QueryCtx, userId: Id<"users">) {
	const assigned = await ctx.db
		.query("pulses")
		.withIndex("by_assignee", (q) => q.eq("assigneeUserId", userId))
		.take(MAX_USER_PULSES);

	const cyclesByStartup = new Map<Id<"startups">, Set<Id<"cycles">>>();
	const pulsesByStartup = new Map<Id<"startups">, number>();
	for (const pulse of assigned) {
		if (pulse.trialCycleId || !pulse.cycleId || pulse.status !== "done") {
			continue;
		}
		pulsesByStartup.set(
			pulse.startupId,
			(pulsesByStartup.get(pulse.startupId) ?? 0) + 1,
		);
		const cycle = await ctx.db.get(pulse.cycleId);
		if (cycle?.status === "closed") {
			const cycles = cyclesByStartup.get(pulse.startupId) ?? new Set();
			cycles.add(cycle._id);
			cyclesByStartup.set(pulse.startupId, cycles);
		}
	}

	const startups = [];
	const privateWork = { startups: 0, verifiedPulses: 0, cyclesCompleted: 0 };
	for (const [startupId, verifiedPulses] of pulsesByStartup) {
		const counts: WorkCounts = {
			verifiedPulses,
			cyclesCompleted: cyclesByStartup.get(startupId)?.size ?? 0,
		};
		const startup = await ctx.db.get(startupId);
		if (startup?.isPublic) {
			startups.push({
				startupId,
				name: startup.name,
				slug: startup.slug,
				...counts,
			});
			continue;
		}
		privateWork.startups += 1;
		privateWork.verifiedPulses += counts.verifiedPulses;
		privateWork.cyclesCompleted += counts.cyclesCompleted;
	}

	return { startups, private: privateWork };
}
