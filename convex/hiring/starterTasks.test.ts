import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MAX_STARTER_TASKS } from "../lib/limits";
import { advancePast, createTest, DAY, HOUR } from "../lib/testing.helpers";
import { type Person, signUp } from "../people/users.helpers";
import { cycleTaskFor } from "../work/cycles.helpers";
import {
	joinAsMember,
	type Setup,
	setUpStartup,
} from "../teams/startups.helpers";
import {
	closeWithVerdict,
	createDraftHackathon,
	createHackathon,
	cycleIdOf,
	enterHackathon,
} from "./hackathons.helpers";

async function setUpOpenHackathon() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const hackathonId = await createHackathon(setup, {
		startsInMs: DAY,
		starterTasks: [
			{ title: "Build the API", description: "Do: Build the API" },
		],
	});
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	return { t, setup, hackathonId, alice, bob };
}

/** Alice and Bob are Participants of a running Hackathon with one Starter Task. */
async function setUpRunningHackathon() {
	const hackathon = await setUpOpenHackathon();
	await enterHackathon(hackathon.setup, hackathon.hackathonId, hackathon.alice);
	await enterHackathon(hackathon.setup, hackathon.hackathonId, hackathon.bob);
	await advancePast(hackathon.t, DAY + HOUR);
	return hackathon;
}

async function addStarterTask(
	setup: Setup,
	hackathonId: Id<"hackathons">,
	title: string,
) {
	return await setup.founder.as.mutation(api.hiring.hackathons.addStarterTask, {
		hackathonId,
		title,
		description: `Do: ${title}`,
	});
}

/** The person's own lane on the hackathon's Cycle. */
async function laneOf(person: Person, hackathonId: Id<"hackathons">) {
	const hackathon = await person.as.query(api.hiring.hackathons.get, {
		hackathonId,
	});
	if (!hackathon) {
		throw new Error("No hackathon");
	}
	return await person.as.query(api.work.tasks.listLane, {
		cycleId: hackathon.cycleId,
	});
}

async function boardTitles(person: Person, hackathonId: Id<"hackathons">) {
	return (await laneOf(person, hackathonId)).map((task) => task.title).sort();
}

async function notificationTitles(person: Person) {
	const { notifications } = await person.as.query(
		api.people.notifications.list,
		{},
	);
	return notifications.map((notification) => notification.title);
}

describe("before the start", () => {
	test("starting a Hackathon copies every Starter Task onto each Participant's lane in todo", async () => {
		const { t, setup, hackathonId, alice, bob } = await setUpOpenHackathon();
		await addStarterTask(setup, hackathonId, "Write the docs");
		await enterHackathon(setup, hackathonId, alice);
		await enterHackathon(setup, hackathonId, bob);

		await advancePast(t, DAY + HOUR);

		for (const participant of [alice, bob]) {
			const board = await laneOf(participant, hackathonId);
			expect(board.map((task) => task.title).sort()).toEqual([
				"Build the API",
				"Write the docs",
			]);
			expect(board.map((task) => task.status)).toEqual(["todo", "todo"]);
			expect(board[0]?.description).toMatch(/^Do: /);
		}
	});

	test("Founders list Starter Tasks and remove one before the start", async () => {
		const { setup, hackathonId } = await setUpOpenHackathon();
		const docsId = await addStarterTask(setup, hackathonId, "Write the docs");

		await setup.founder.as.mutation(api.hiring.hackathons.removeStarterTask, {
			taskId: docsId,
		});

		const starterTasks = await setup.founder.as.query(
			api.hiring.hackathons.listStarterTasks,
			{ hackathonId },
		);
		expect(starterTasks.map((starterTask) => starterTask.title)).toEqual([
			"Build the API",
		]);
	});

	test("Founders can add Starter Tasks to a draft before paying to publish it", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, { starterTasks: [] });

		await addStarterTask(setup, hackathonId, "Build the API");

		const starterTasks = await setup.founder.as.query(
			api.hiring.hackathons.listStarterTasks,
			{ hackathonId },
		);
		expect(starterTasks.map((starterTask) => starterTask.title)).toEqual([
			"Build the API",
		]);
	});

	test("a Hackathon has a bounded number of Starter Tasks", async () => {
		const { setup, hackathonId } = await setUpOpenHackathon();
		// The open hackathon already has one Starter Task.
		for (let i = 1; i < MAX_STARTER_TASKS; i++) {
			await addStarterTask(setup, hackathonId, `Starter Task ${i}`);
		}

		await expect(
			addStarterTask(setup, hackathonId, "One too many"),
		).rejects.toThrow("at most");
	});
});

describe("mid-hackathon", () => {
	test("a Starter Task added mid-hackathon reaches every current Participant's lane in todo and notifies them", async () => {
		const { setup, hackathonId, alice, bob } = await setUpRunningHackathon();

		await addStarterTask(setup, hackathonId, "Ship the demo");

		for (const participant of [alice, bob]) {
			const board = await laneOf(participant, hackathonId);
			const demo = board.find((task) => task.title === "Ship the demo");
			expect(demo?.status).toBe("todo");
			expect(board).toHaveLength(2);
			expect(await notificationTitles(participant)).toContain(
				"New Starter Task in Build a feature: Ship the demo",
			);
		}
	});

	test("a Participant who left gets no copy of a mid-hackathon Starter Task", async () => {
		const { setup, hackathonId, alice, bob } = await setUpRunningHackathon();
		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		await addStarterTask(setup, hackathonId, "Ship the demo");

		expect(await boardTitles(bob, hackathonId)).toContain("Ship the demo");
		const cycleId = await cycleIdOf(setup.t, hackathonId);
		const aliceCopies = await setup.t.run(
			async (ctx) =>
				await ctx.db
					.query("tasks")
					.withIndex("by_cycle_and_assignee", (q) =>
						q.eq("cycleId", cycleId).eq("assigneeUserId", alice.userId),
					)
					.take(10),
		);
		expect(aliceCopies.map((task) => task.title)).toEqual(["Build the API"]);
		expect(await notificationTitles(alice)).not.toContain(
			"New Starter Task in Build a feature: Ship the demo",
		);
	});

	test("removing a Starter Task mid-hackathon keeps Participants' copies and notifies them", async () => {
		const { setup, hackathonId, alice } = await setUpRunningHackathon();
		const [apiStarterTask] = await setup.founder.as.query(
			api.hiring.hackathons.listStarterTasks,
			{ hackathonId },
		);

		await setup.founder.as.mutation(api.hiring.hackathons.removeStarterTask, {
			taskId: apiStarterTask?._id as Id<"tasks">,
		});

		expect(
			await setup.founder.as.query(api.hiring.hackathons.listStarterTasks, {
				hackathonId,
			}),
		).toEqual([]);
		expect(await boardTitles(alice, hackathonId)).toEqual(["Build the API"]);
		expect(await notificationTitles(alice)).toContain(
			"Starter Task removed from Build a feature: Build the API",
		);
	});

	test("the 21st Starter Task is refused mid-hackathon and no Board changes", async () => {
		const { setup, hackathonId, alice } = await setUpRunningHackathon();
		for (let i = 1; i < MAX_STARTER_TASKS; i++) {
			await addStarterTask(setup, hackathonId, `Starter Task ${i}`);
		}

		await expect(
			addStarterTask(setup, hackathonId, "One too many"),
		).rejects.toThrow("at most");

		expect(await boardTitles(alice, hackathonId)).toHaveLength(
			MAX_STARTER_TASKS,
		);
	});
});

describe("after the end", () => {
	test("Starter Tasks can't change after the Hackathon closes", async () => {
		const { t, setup, hackathonId, alice } = await setUpOpenHackathon();
		await enterHackathon(setup, hackathonId, alice);
		await advancePast(t, DAY + HOUR);
		const [starterTask] = await setup.founder.as.query(
			api.hiring.hackathons.listStarterTasks,
			{ hackathonId },
		);
		await closeWithVerdict(setup, hackathonId, alice, "passed");

		await expect(
			addStarterTask(setup, hackathonId, "Too late"),
		).rejects.toThrow("Starter Tasks can't change after the Hackathon ends");
		await expect(
			setup.founder.as.mutation(api.hiring.hackathons.removeStarterTask, {
				taskId: starterTask?._id as Id<"tasks">,
			}),
		).rejects.toThrow("Starter Tasks can't change after the Hackathon ends");
	});

	test("Starter Tasks can't change after the Hackathon is cancelled", async () => {
		const { setup, hackathonId } = await setUpOpenHackathon();
		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		await expect(
			addStarterTask(setup, hackathonId, "Too late"),
		).rejects.toThrow("Starter Tasks can't change after the Hackathon ends");
	});
});

describe("access", () => {
	test("Members can list Starter Tasks but not add or remove them", async () => {
		const { setup, hackathonId } = await setUpOpenHackathon();
		const member = await joinAsMember(setup, "Mia");
		const [starterTask] = await setup.founder.as.query(
			api.hiring.hackathons.listStarterTasks,
			{ hackathonId },
		);

		const listed = await member.as.query(
			api.hiring.hackathons.listStarterTasks,
			{
				hackathonId,
			},
		);

		expect(listed.map((item) => item.title)).toEqual(["Build the API"]);
		await expect(
			member.as.mutation(api.hiring.hackathons.addStarterTask, {
				hackathonId,
				title: "Sneaky",
			}),
		).rejects.toThrow();
		await expect(
			member.as.mutation(api.hiring.hackathons.removeStarterTask, {
				taskId: starterTask?._id as Id<"tasks">,
			}),
		).rejects.toThrow();
	});

	test("people outside the Startup cannot add, list or remove Starter Tasks", async () => {
		const { setup, hackathonId, alice } = await setUpOpenHackathon();
		const starterTaskId = await addStarterTask(
			setup,
			hackathonId,
			"Write docs",
		);

		await expect(
			alice.as.mutation(api.hiring.hackathons.addStarterTask, {
				hackathonId,
				title: "Sneaky",
			}),
		).rejects.toThrow("not a member");
		await expect(
			alice.as.query(api.hiring.hackathons.listStarterTasks, { hackathonId }),
		).rejects.toThrow("not a member");
		await expect(
			alice.as.mutation(api.hiring.hackathons.removeStarterTask, {
				taskId: starterTaskId,
			}),
		).rejects.toThrow("not a member");
	});
});

describe("where Starter Tasks show", () => {
	test("a Starter Task is never anyone's Task: only its copies reach Boards", async () => {
		const { setup, hackathonId, alice } = await setUpRunningHackathon();
		const { cycleId } = await cycleTaskFor(setup, setup.founder);

		await addStarterTask(setup, hackathonId, "Ship the demo");

		expect(await boardTitles(alice, hackathonId)).toEqual([
			"Build the API",
			"Ship the demo",
		]);
		const titles = (tasks: { title: string }[]) =>
			tasks.map((task) => task.title);
		expect(
			titles(await setup.founder.as.query(api.work.tasks.listMine, {})),
		).toEqual(["Hero section"]);
		expect(
			titles(
				await setup.founder.as.query(api.work.tasks.listForCycle, { cycleId }),
			),
		).toEqual(["Hero section"]);
		expect(
			await setup.founder.as.query(api.work.tasks.listToReview, {}),
		).toEqual([]);
		const profile = await setup.t.query(api.people.users.getByUsername, {
			username: "founder",
		});
		expect(profile?.proofOfWork.startups).toEqual([]);
		expect(profile?.proofOfWork.private.verifiedTasks).toBe(0);
	});
});
