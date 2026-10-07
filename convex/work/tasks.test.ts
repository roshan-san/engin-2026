import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, DAY } from "../lib/testing.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { cycleTaskFor, submitWithProof } from "./cycles.helpers";

async function setUpCycle() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const cycleId = await setup.founder.as.mutation(api.work.cycles.create, {
		startupId: setup.startupId,
		title: "Landing page",
		goal: "Ship the landing page",
		startAt: Date.now(),
		endAt: Date.now() + 7 * DAY,
	});
	return { t, setup, cycleId };
}

test("a new internal Task starts in todo", async () => {
	const { setup, cycleId } = await setUpCycle();

	await setup.founder.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	const tasks = await setup.founder.as.query(api.work.tasks.listForCycle, {
		cycleId,
	});
	expect(tasks.map((task) => task.status)).toEqual(["todo"]);
});

test("Proof Links can be added to and removed from a Task", async () => {
	const { setup, cycleId } = await setUpCycle();
	const taskId = await setup.founder.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	await setup.founder.as.mutation(api.work.tasks.addProofLink, {
		taskId,
		kind: "pr",
		url: "https://github.com/acme/web/pull/1",
	});
	await setup.founder.as.mutation(api.work.tasks.addProofLink, {
		taskId,
		kind: "deploy",
		url: "https://acme.dev",
	});
	await setup.founder.as.mutation(api.work.tasks.removeProofLink, {
		taskId,
		url: "https://github.com/acme/web/pull/1",
	});

	const [task] = await setup.founder.as.query(api.work.tasks.listForCycle, {
		cycleId,
	});
	expect(task?.proofLinks).toEqual([
		{ kind: "deploy", url: "https://acme.dev" },
	]);
});

test("a Proof Link must be a web address", async () => {
	const { setup, cycleId } = await setUpCycle();
	const taskId = await setup.founder.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	await expect(
		setup.founder.as.mutation(api.work.tasks.addProofLink, {
			taskId,
			kind: "doc",
			url: "not a link",
		}),
	).rejects.toThrow("must start with http");
});

test("anyone in a Cycle can edit a Task's title and description", async () => {
	const { setup, cycleId } = await setUpCycle();
	const taskId = await setup.founder.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	await setup.founder.as.mutation(api.work.tasks.update, {
		taskId,
		title: "Hero and pricing",
		description: "Two sections",
	});

	const [task] = await setup.founder.as.query(api.work.tasks.listForCycle, {
		cycleId,
	});
	expect(task?.title).toBe("Hero and pricing");
	expect(task?.description).toBe("Two sections");
});

describe("taking and deleting", () => {
	async function setUpTeam() {
		const t = createTest();
		const setup = await setUpStartup(t);
		const bob = await joinAsMember(setup, "Bob");
		const carol = await joinAsMember(setup, "Carol");
		const { cycleId, taskId, statusOf } = await cycleTaskFor(setup, bob);
		await setup.founder.as.mutation(api.work.cycles.addMember, {
			cycleId,
			userId: carol.userId,
		});
		return { setup, bob, carol, cycleId, taskId, statusOf };
	}

	test("nobody can take a Task someone else holds", async () => {
		const { setup, bob, carol, cycleId, taskId } = await setUpTeam();

		await expect(
			carol.as.mutation(api.work.tasks.assignToMe, { taskId }),
		).rejects.toThrow("Someone else has taken this Task");

		const tasks = await setup.founder.as.query(api.work.tasks.listForCycle, {
			cycleId,
		});
		expect(tasks[0]?.assignee?._id).toBe(bob.userId);
	});

	test("the creator deletes their Task", async () => {
		const { setup, bob, cycleId, taskId } = await setUpTeam();

		await bob.as.mutation(api.work.tasks.remove, { taskId });

		expect(
			await setup.founder.as.query(api.work.tasks.listForCycle, { cycleId }),
		).toEqual([]);
	});

	test("another Member cannot delete someone's Task", async () => {
		const { carol, taskId } = await setUpTeam();

		await expect(
			carol.as.mutation(api.work.tasks.remove, { taskId }),
		).rejects.toThrow("You cannot delete this Task");
	});

	test("a Founder deletes any Task that is not in review or done", async () => {
		const { setup, cycleId, taskId } = await setUpTeam();

		await setup.founder.as.mutation(api.work.tasks.remove, { taskId });

		expect(
			await setup.founder.as.query(api.work.tasks.listForCycle, { cycleId }),
		).toEqual([]);
	});

	test("a Task in review or verified cannot be deleted", async () => {
		const { setup, bob, taskId } = await setUpTeam();
		await submitWithProof(bob, taskId);

		await expect(
			setup.founder.as.mutation(api.work.tasks.remove, { taskId }),
		).rejects.toThrow("This Task is awaiting review");
		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });
		await expect(
			setup.founder.as.mutation(api.work.tasks.remove, { taskId }),
		).rejects.toThrow("This Task is already verified");
	});
});
