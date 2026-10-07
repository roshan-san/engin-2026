import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { DAY } from "../lib/testing.helpers";
import type { Person } from "../people/users.helpers";
import type { Setup } from "../teams/startups.helpers";

/** A Cycle (active unless another one already is) in the setup's Startup, with one Task assigned to `worker`. */
export async function cycleTaskFor(setup: Setup, worker: Person) {
	const cycleId = await setup.founder.as.mutation(api.work.cycles.create, {
		startupId: setup.startupId,
		title: "Landing page",
		goal: "Ship the landing page",
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
	const taskId = await worker.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});
	await worker.as.mutation(api.work.tasks.assignToMe, { taskId });

	async function statusOf() {
		const tasks = await setup.founder.as.query(api.work.tasks.listForCycle, {
			cycleId,
		});
		return tasks.find((task) => task._id === taskId)?.status;
	}

	return { cycleId, taskId, statusOf };
}

/** Adds a PR proof link, then sends the Task to Review, as review now requires. */
export async function submitWithProof(person: Person, taskId: Id<"tasks">) {
	await person.as.mutation(api.work.tasks.addProofLink, {
		taskId,
		kind: "pr",
		url: "https://github.com/acme/app/pull/1",
	});
	await person.as.mutation(api.work.tasks.setStatus, {
		taskId,
		status: "review",
	});
}
