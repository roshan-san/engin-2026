import { internalMutation } from "./_generated/server";
import { currentStatus, proofLinksOf } from "./lib/pulses";

/**
 * One-off: moves Pulses onto the kanban states and Proof Links, and drops
 * internal Pulses that never belonged to a Cycle. Dev data only, so dropping
 * is acceptable. Idempotent.
 */
export const migratePulses = internalMutation({
	args: {},
	handler: async (ctx) => {
		for await (const pulse of ctx.db.query("pulses")) {
			if (!pulse.trialCycleId && !pulse.cycleId) {
				await ctx.db.delete(pulse._id);
				continue;
			}
			await ctx.db.patch(pulse._id, {
				status: currentStatus(pulse),
				proofLinks: proofLinksOf(pulse),
				evidenceUrl: undefined,
			});
		}
	},
});
