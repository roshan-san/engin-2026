import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import {
	applicationIdOf,
	createHackathon,
	cycleIdOf,
	enterHackathon,
} from "../hiring/hackathons.helpers";
import { MAX_BOARD_TASKS } from "../lib/limits";
import { advancePast, createTest, DAY, HOUR } from "../lib/testing.helpers";
import { type Person, signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { submitWithProof } from "./cycles.helpers";

/** A started Hackathon with one Starter Task, Alice and Bob as Participants. */
async function setUpLanes() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const hackathonId = await createHackathon(setup, {
		startsInMs: DAY,
		starterTasks: [{ title: "Build the API" }],
	});
	const cycleId = await cycleIdOf(t, hackathonId);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	for (const participant of [alice, bob]) {
		await enterHackathon(setup, hackathonId, participant);
	}
	await advancePast(t, DAY + HOUR);

	async function laneOf(viewer: Person, owner?: Person) {
		return await viewer.as.query(api.work.tasks.listLane, {
			cycleId,
			assigneeUserId: owner?.userId,
		});
	}

	async function firstTaskOf(owner: Person) {
		const [task] = await laneOf(owner);
		if (!task) {
			throw new Error("Lane is empty");
		}
		return task;
	}

	/** Runs out the clock and closes with a Passed Verdict for everyone. */
	async function close() {
		await advancePast(t, 8 * DAY);
		const verdicts = [];
		for (const participant of [alice, bob]) {
			verdicts.push({
				applicationId: await applicationIdOf(
					t,
					hackathonId,
					participant.userId,
				),
				verdict: "passed" as const,
			});
		}
		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId,
			verdicts,
		});
	}

	return {
		t,
		setup,
		hackathonId,
		cycleId,
		alice,
		bob,
		laneOf,
		firstTaskOf,
		close,
	};
}

describe("reading a lane", () => {
	test("a Participant cannot read another Participant's lane", async () => {
		const { alice, bob, laneOf } = await setUpLanes();

		await expect(laneOf(alice, bob)).rejects.toThrow(
			"You do not have access to this Board",
		);
	});

	test("a Founder can read any Participant's lane", async () => {
		const { setup, alice, bob, laneOf } = await setUpLanes();

		expect(await laneOf(setup.founder, alice)).toHaveLength(1);
		expect(await laneOf(setup.founder, bob)).toHaveLength(1);
	});

	test("a completed Participant still reads their lane after the close but cannot change it", async () => {
		const { alice, laneOf, firstTaskOf, close } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);

		await close();

		expect(await laneOf(alice)).toHaveLength(1);
		await expect(
			alice.as.mutation(api.work.tasks.setStatus, {
				taskId,
				status: "in_progress",
			}),
		).rejects.toThrow("This Hackathon is not active");
	});

	test("a Participant who left cannot read their lane", async () => {
		const { hackathonId, alice, laneOf } = await setUpLanes();

		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		await expect(laneOf(alice)).rejects.toThrow(
			"You do not have access to this Board",
		);
	});

	test("a Member who is not a Founder cannot read a lane", async () => {
		const { setup, alice, laneOf } = await setUpLanes();
		const member = await joinAsMember(setup, "Casey");

		await expect(laneOf(member, alice)).rejects.toThrow(
			"You do not have access to this Board",
		);
	});

	test("a hackathon's Cycle is not read as a whole board", async () => {
		const { setup, cycleId } = await setUpLanes();

		await expect(
			setup.founder.as.query(api.work.tasks.listForCycle, { cycleId }),
		).rejects.toThrow("Open this board from its hackathon");
	});
});

describe("working a lane", () => {
	test("a Participant's new Task goes on their own lane, assigned to them", async () => {
		const { setup, cycleId, alice, bob, laneOf } = await setUpLanes();

		await alice.as.mutation(api.work.tasks.create, {
			startupId: setup.startupId,
			cycleId,
			title: "Design the schema",
		});

		const aliceLane = await laneOf(alice);
		expect(aliceLane.map((task) => task.title).sort()).toEqual([
			"Build the API",
			"Design the schema",
		]);
		expect(
			aliceLane.every((task) => task.assigneeUserId === alice.userId),
		).toBe(true);
		expect((await laneOf(bob)).map((task) => task.title)).toEqual([
			"Build the API",
		]);
	});

	test(`a lane holds at most ${MAX_BOARD_TASKS} Tasks`, async () => {
		const { setup, cycleId, alice } = await setUpLanes();
		for (let i = 1; i < MAX_BOARD_TASKS; i++) {
			await alice.as.mutation(api.work.tasks.create, {
				startupId: setup.startupId,
				cycleId,
				title: `Task ${i}`,
			});
		}

		await expect(
			alice.as.mutation(api.work.tasks.create, {
				startupId: setup.startupId,
				cycleId,
				title: "One too many",
			}),
		).rejects.toThrow(`A Board can have at most ${MAX_BOARD_TASKS} Tasks`);
	});

	test("a Participant moves their Task to In progress and sends it to Review, but not to Done", async () => {
		const { alice, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);

		await alice.as.mutation(api.work.tasks.setStatus, {
			taskId,
			status: "in_progress",
		});
		await expect(
			alice.as.mutation(api.work.tasks.setStatus, { taskId, status: "done" }),
		).rejects.toThrow("Only a Founder can verify a Task, once it is in review");
		await submitWithProof(alice, taskId);

		expect((await firstTaskOf(alice)).status).toBe("review");
	});

	test("a Participant edits and deletes Tasks on their own lane", async () => {
		const { alice, laneOf, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);

		await alice.as.mutation(api.work.tasks.update, {
			taskId,
			title: "Build the REST API",
			description: "Start with auth",
		});
		const edited = await firstTaskOf(alice);
		expect(edited.title).toBe("Build the REST API");
		expect(edited.description).toBe("Start with auth");

		await alice.as.mutation(api.work.tasks.remove, { taskId });
		expect(await laneOf(alice)).toEqual([]);
	});

	test("a Participant cannot change another Participant's Task", async () => {
		const { alice, bob, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);

		await expect(
			bob.as.mutation(api.work.tasks.setStatus, {
				taskId,
				status: "in_progress",
			}),
		).rejects.toThrow("This Task is not on your lane");
		await expect(
			bob.as.mutation(api.work.tasks.update, { taskId, title: "Mine now" }),
		).rejects.toThrow("This Task is not on your lane");
		await expect(
			bob.as.mutation(api.work.tasks.remove, { taskId }),
		).rejects.toThrow("This Task is not on your lane");
		expect((await firstTaskOf(alice)).status).toBe("todo");
	});

	test("nobody can take a lane's Task, its owner included", async () => {
		const { setup, alice, bob, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);

		for (const person of [alice, bob, setup.founder]) {
			await expect(
				person.as.mutation(api.work.tasks.assignToMe, { taskId }),
			).rejects.toThrow("A hackathon Task stays on its lane");
		}
	});

	test("an unassigned Starter Task is nobody's lane", async () => {
		const { t, cycleId, alice } = await setUpLanes();
		const template = await t.run(
			async (ctx) =>
				await ctx.db
					.query("tasks")
					.withIndex("by_cycle_and_assignee", (q) =>
						q.eq("cycleId", cycleId).eq("assigneeUserId", undefined),
					)
					.first(),
		);
		if (!template) {
			throw new Error("No Starter Task");
		}

		await expect(
			alice.as.mutation(api.work.tasks.setStatus, {
				taskId: template._id,
				status: "in_progress",
			}),
		).rejects.toThrow("This Task is not on your lane");
		await expect(
			alice.as.mutation(api.work.tasks.assignToMe, { taskId: template._id }),
		).rejects.toThrow("A hackathon Task stays on its lane");
	});

	test("a lane cannot be worked once the Hackathon has ended", async () => {
		const { setup, hackathonId, cycleId, alice, firstTaskOf } =
			await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);

		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		await expect(
			alice.as.mutation(api.work.tasks.setStatus, {
				taskId,
				status: "in_progress",
			}),
		).rejects.toThrow("This Hackathon is not active");
		await expect(
			alice.as.mutation(api.work.tasks.create, {
				startupId: setup.startupId,
				cycleId,
				title: "Too late",
			}),
		).rejects.toThrow("This Hackathon is not active");
	});

	test("a lane cannot be worked before the Hackathon starts", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterHackathon(setup, hackathonId, alice);

		await expect(
			alice.as.mutation(api.work.tasks.create, {
				startupId: setup.startupId,
				cycleId: await cycleIdOf(t, hackathonId),
				title: "Too early",
			}),
		).rejects.toThrow("This Hackathon is not active");
	});
});

describe("a Founder on a lane", () => {
	test("a Founder cannot move, edit, add proof to or delete a Participant's Task", async () => {
		const { setup, cycleId, alice, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);
		const founder = setup.founder.as;

		await expect(
			founder.mutation(api.work.tasks.setStatus, {
				taskId,
				status: "in_progress",
			}),
		).rejects.toThrow("This Task is not on your lane");
		await expect(
			founder.mutation(api.work.tasks.update, { taskId, title: "Typo fix" }),
		).rejects.toThrow("This Task is not on your lane");
		await expect(
			founder.mutation(api.work.tasks.addProofLink, {
				taskId,
				kind: "pr",
				url: "https://github.com/acme/api/pull/1",
			}),
		).rejects.toThrow("This Task is not on your lane");
		await expect(
			founder.mutation(api.work.tasks.remove, { taskId }),
		).rejects.toThrow("This Task is not on your lane");
		await expect(
			founder.mutation(api.work.tasks.create, {
				startupId: setup.startupId,
				cycleId,
				title: "Founder-added",
			}),
		).rejects.toThrow("Only Participants add Tasks to a hackathon");
	});

	test("a Founder verifies a Participant's Task in Review", async () => {
		const { setup, alice, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);
		await submitWithProof(alice, taskId);

		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });

		expect((await firstTaskOf(alice)).status).toBe("done");
	});

	test("a Founder sends a Participant's Task back with a note", async () => {
		const { setup, alice, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);
		await submitWithProof(alice, taskId);

		await setup.founder.as.mutation(api.work.tasks.reject, {
			taskId,
			note: "Add tests",
		});

		const task = await firstTaskOf(alice);
		expect(task.status).toBe("in_progress");
		expect(task.reviewNote).toBe("Add tests");
	});
});

describe("proof links", () => {
	test("a Participant adds and removes proof links on their Task while it runs", async () => {
		const { alice, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);
		const url = "https://github.com/acme/api/pull/12";

		await alice.as.mutation(api.work.tasks.addProofLink, {
			taskId,
			kind: "pr",
			url,
		});
		expect((await firstTaskOf(alice)).proofLinks).toEqual([
			{ kind: "pr", url },
		]);

		await alice.as.mutation(api.work.tasks.removeProofLink, { taskId, url });
		expect((await firstTaskOf(alice)).proofLinks).toEqual([]);
	});

	test("proof is frozen while the Task is in Review", async () => {
		const { alice, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);
		await submitWithProof(alice, taskId);

		await expect(
			alice.as.mutation(api.work.tasks.removeProofLink, {
				taskId,
				url: "https://github.com/acme/app/pull/1",
			}),
		).rejects.toThrow("This Task is awaiting review");
	});

	test("the eleventh proof link on a Task is refused", async () => {
		const { alice, firstTaskOf } = await setUpLanes();
		const { _id: taskId } = await firstTaskOf(alice);
		for (let i = 0; i < 10; i++) {
			await alice.as.mutation(api.work.tasks.addProofLink, {
				taskId,
				kind: "commit",
				url: `https://github.com/acme/api/commit/${i}`,
			});
		}

		await expect(
			alice.as.mutation(api.work.tasks.addProofLink, {
				taskId,
				kind: "commit",
				url: "https://github.com/acme/api/commit/10",
			}),
		).rejects.toThrow("A Task can have at most 10 Proof Links");
	});
});
