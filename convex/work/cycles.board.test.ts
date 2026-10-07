import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest } from "../lib/testing.helpers";
import { MAX_CYCLE_TASKS } from "../lib/limits";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { cycleTaskFor, submitWithProof } from "./cycles.helpers";

async function setUpBoard() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const cycle = await cycleTaskFor(setup, bob);
	return { t, setup, bob, ...cycle };
}

test("taking an unassigned Todo Task assigns it and moves it to In progress", async () => {
	const { setup, bob, cycleId } = await setUpBoard();
	const taskId = await bob.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		title: "Pricing table",
		cycleId,
	});

	await bob.as.mutation(api.work.tasks.assignToMe, { taskId });

	const tasks = await bob.as.query(api.work.tasks.listForCycle, { cycleId });
	const task = tasks.find((item) => item._id === taskId);
	expect(task?.status).toBe("in_progress");
	expect(task?.assignee?.name).toBe("Bob");
});

test("a Member moves work between Todo, In progress and Review", async () => {
	const { bob, taskId, statusOf } = await setUpBoard();

	await bob.as.mutation(api.work.tasks.setStatus, { taskId, status: "todo" });
	expect(await statusOf()).toBe("todo");
	await bob.as.mutation(api.work.tasks.setStatus, {
		taskId,
		status: "in_progress",
	});
	expect(await statusOf()).toBe("in_progress");
});

test("a Done Task is final", async () => {
	const { setup, bob, taskId } = await setUpBoard();
	await submitWithProof(bob, taskId);
	await setup.founder.as.mutation(api.work.tasks.verify, { taskId });

	await expect(
		setup.founder.as.mutation(api.work.tasks.setStatus, {
			taskId,
			status: "in_progress",
		}),
	).rejects.toThrow("This Task is already verified");
});

test("a closed Cycle's board is read-only", async () => {
	const { setup, bob, cycleId, taskId } = await setUpBoard();
	const inReview = await bob.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		title: "Review me",
		cycleId,
	});
	await submitWithProof(bob, inReview);

	await setup.founder.as.mutation(api.work.cycles.close, { cycleId });

	const refusals = [
		bob.as.mutation(api.work.tasks.setStatus, { taskId, status: "todo" }),
		bob.as.mutation(api.work.tasks.create, {
			startupId: setup.startupId,
			title: "Late",
			cycleId,
		}),
		bob.as.mutation(api.work.tasks.assignToMe, { taskId }),
		bob.as.mutation(api.work.tasks.remove, { taskId }),
		setup.founder.as.mutation(api.work.tasks.verify, { taskId: inReview }),
		setup.founder.as.mutation(api.work.tasks.reject, {
			taskId: inReview,
			note: "Redo",
		}),
	];
	for (const refusal of refusals) {
		await expect(refusal).rejects.toThrow("This Cycle is closed");
	}
});

test("a Cycle holds at most 200 Tasks", async () => {
	const { t, setup, bob, cycleId } = await setUpBoard();
	await t.run(async (ctx) => {
		for (let index = 1; index < MAX_CYCLE_TASKS; index++) {
			await ctx.db.insert("tasks", {
				startupId: setup.startupId,
				cycleId,
				title: `Task ${index}`,
				status: "todo",
				createdByUserId: bob.userId,
			});
		}
	});

	await expect(
		bob.as.mutation(api.work.tasks.create, {
			startupId: setup.startupId,
			title: "One too many",
			cycleId,
		}),
	).rejects.toThrow("A Cycle can have at most 200 Tasks");
});
