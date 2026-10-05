import { api } from "../_generated/api";
import { DAY } from "../lib/testing.helpers";
import type { Person } from "../people/users.helpers";
import type { Setup } from "../teams/startups.helpers";

/** A Cycle (active unless another one already is) in the setup's Startup, with one Pulse assigned to `worker`. */
export async function cyclePulseFor(setup: Setup, worker: Person) {
	const cycleId = await setup.founder.as.mutation(api.work.cycles.create, {
		startupId: setup.startupId,
		title: "Landing page",
		startAt: Date.now(),
		endAt: Date.now() + 7 * DAY,
		memberUserIds: worker === setup.founder ? [] : [worker.userId],
	});
	const cycles = await setup.founder.as.query(api.work.cycles.list, {
		startupId: setup.startupId,
	});
	if (!cycles.some((cycle) => cycle.status === "active")) {
		await setup.founder.as.mutation(api.work.cycles.start, { cycleId });
	}
	const pulseId = await worker.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});
	await worker.as.mutation(api.work.pulses.assignToMe, { pulseId });

	async function statusOf() {
		const pulses = await setup.founder.as.query(api.work.pulses.listForCycle, {
			cycleId,
		});
		return pulses.find((pulse) => pulse._id === pulseId)?.status;
	}

	return { cycleId, pulseId, statusOf };
}
