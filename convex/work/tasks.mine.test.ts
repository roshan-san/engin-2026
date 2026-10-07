import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { cycleIdOf, startedHackathonWith } from "../hiring/hackathons.helpers";
import { createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { cycleTaskFor, submitWithProof } from "./cycles.helpers";

async function setUpWork() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const task = await cycleTaskFor(setup, bob);
	return { t, setup, bob, ...task };
}

describe("My Tasks", () => {
	test("lists a Cycle Task with its Startup and Cycle", async () => {
		const { bob, cycleId } = await setUpWork();

		const tasks = await bob.as.query(api.work.tasks.listMine, {});

		expect(tasks).toHaveLength(1);
		expect(tasks[0]).toMatchObject({
			title: "Hero section",
			status: "in_progress",
			startupName: "Acme",
			place: { kind: "cycle", cycleId, title: "Landing page" },
		});
	});

	test("lists a Participant's lane Tasks with their hackathon", async () => {
		const { setup } = await setUpWork();
		const alice = await signUp(setup.t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);

		const tasks = await alice.as.query(api.work.tasks.listMine, {});

		expect(tasks).toHaveLength(1);
		expect(tasks[0]).toMatchObject({
			title: "Ship the feature",
			status: "todo",
			startupName: "Acme",
			place: { kind: "hackathon", hackathonId, title: "Build a feature" },
		});
	});

	test("hides lane Tasks once the Participant left", async () => {
		const { setup } = await setUpWork();
		const alice = await signUp(setup.t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);

		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		expect(await alice.as.query(api.work.tasks.listMine, {})).toEqual([]);
	});

	test("hides Tasks on a Cycle the user was removed from", async () => {
		const { setup, bob, cycleId } = await setUpWork();

		await setup.founder.as.mutation(api.work.cycles.removeMember, {
			cycleId,
			userId: bob.userId,
		});

		expect(await bob.as.query(api.work.tasks.listMine, {})).toEqual([]);
	});
});

describe("awaiting review", () => {
	test("a Founder sees a submitted Task with its assignee and Cycle", async () => {
		const { setup, bob, taskId, cycleId } = await setUpWork();

		await submitWithProof(bob, taskId);

		const queue = await setup.founder.as.query(api.work.tasks.listToReview, {});
		expect(queue).toHaveLength(1);
		expect(queue[0]).toMatchObject({
			title: "Hero section",
			place: { kind: "cycle", cycleId, title: "Landing page" },
			assignee: { _id: bob.userId },
		});
	});

	test("a Founder sees a Participant's submitted hackathon Task, labelled with the hackathon", async () => {
		const { setup } = await setUpWork();
		const alice = await signUp(setup.t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		const [task] = await alice.as.query(api.work.tasks.listLane, {
			cycleId: await cycleIdOf(setup.t, hackathonId),
		});
		if (!task) {
			throw new Error("Lane is empty");
		}

		await submitWithProof(alice, task._id);

		const queue = await setup.founder.as.query(api.work.tasks.listToReview, {});
		expect(queue).toContainEqual(
			expect.objectContaining({
				title: "Ship the feature",
				startupSlug: "acme",
				place: { kind: "hackathon", hackathonId, title: "Build a feature" },
				assignee: expect.objectContaining({ _id: alice.userId }),
			}),
		);
	});

	test("a Member who founds nothing has no review queue", async () => {
		const { bob, taskId } = await setUpWork();
		await submitWithProof(bob, taskId);

		expect(await bob.as.query(api.work.tasks.listToReview, {})).toEqual([]);
	});

	test("a verified Task leaves the queue", async () => {
		const { setup, bob, taskId } = await setUpWork();
		await submitWithProof(bob, taskId);

		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });

		expect(
			await setup.founder.as.query(api.work.tasks.listToReview, {}),
		).toEqual([]);
	});
});
