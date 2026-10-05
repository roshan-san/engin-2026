import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MAX_TRIAL_CHALLENGES } from "../lib/limits";
import { advancePast, createTest, DAY, HOUR } from "../lib/testing.helpers";
import { type Person, signUp } from "../people/users.helpers";
import {
	joinAsMember,
	type Setup,
	setUpStartup,
} from "../teams/startups.helpers";
import {
	closeWithVerdict,
	createDraftTrial,
	createTrial,
	enterTrial,
} from "./trialCycles.helpers";

async function setUpOpenTrial() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, {
		startsInMs: DAY,
		challenges: [{ title: "Build the API", description: "Do: Build the API" }],
	});
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	return { t, setup, trialCycleId, alice, bob };
}

/** Alice and Bob are Participants of a running Trial Cycle with one Challenge. */
async function setUpRunningTrial() {
	const trial = await setUpOpenTrial();
	await enterTrial(trial.setup, trial.trialCycleId, trial.alice);
	await enterTrial(trial.setup, trial.trialCycleId, trial.bob);
	await advancePast(trial.t, DAY + HOUR);
	return trial;
}

async function addChallenge(
	setup: Setup,
	trialCycleId: Id<"trialCycles">,
	title: string,
) {
	return await setup.founder.as.mutation(api.hiring.challenges.add, {
		trialCycleId,
		title,
		description: `Do: ${title}`,
	});
}

async function boardTitles(person: Person, trialCycleId: Id<"trialCycles">) {
	const board = await person.as.query(api.work.pulses.listBoard, {
		trialCycleId,
	});
	return board.map((pulse) => pulse.title).sort();
}

async function notificationTitles(person: Person) {
	const { notifications } = await person.as.query(
		api.people.notifications.list,
		{},
	);
	return notifications.map((notification) => notification.title);
}

describe("before the start", () => {
	test("starting a Trial Cycle copies every Challenge onto each Participant's Board in todo", async () => {
		const { t, setup, trialCycleId, alice, bob } = await setUpOpenTrial();
		await addChallenge(setup, trialCycleId, "Write the docs");
		await enterTrial(setup, trialCycleId, alice);
		await enterTrial(setup, trialCycleId, bob);

		await advancePast(t, DAY + HOUR);

		for (const participant of [alice, bob]) {
			const board = await participant.as.query(api.work.pulses.listBoard, {
				trialCycleId,
			});
			expect(board.map((pulse) => pulse.title).sort()).toEqual([
				"Build the API",
				"Write the docs",
			]);
			expect(board.map((pulse) => pulse.status)).toEqual(["todo", "todo"]);
			expect(board[0]?.description).toMatch(/^Do: /);
		}
	});

	test("Founders list Challenges and remove one before the start", async () => {
		const { setup, trialCycleId } = await setUpOpenTrial();
		const docsId = await addChallenge(setup, trialCycleId, "Write the docs");

		await setup.founder.as.mutation(api.hiring.challenges.remove, {
			challengeId: docsId,
		});

		const challenges = await setup.founder.as.query(
			api.hiring.challenges.list,
			{ trialCycleId },
		);
		expect(challenges.map((challenge) => challenge.title)).toEqual([
			"Build the API",
		]);
	});

	test("Founders can add Challenges to a draft before paying to publish it", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup, { challenges: [] });

		await addChallenge(setup, trialCycleId, "Build the API");

		const challenges = await setup.founder.as.query(
			api.hiring.challenges.list,
			{ trialCycleId },
		);
		expect(challenges.map((challenge) => challenge.title)).toEqual([
			"Build the API",
		]);
	});

	test("a Trial Cycle has a bounded number of Challenges", async () => {
		const { setup, trialCycleId } = await setUpOpenTrial();
		// The open trial already has one Starting Pulse.
		for (let i = 1; i < MAX_TRIAL_CHALLENGES; i++) {
			await addChallenge(setup, trialCycleId, `Challenge ${i}`);
		}

		await expect(
			addChallenge(setup, trialCycleId, "One too many"),
		).rejects.toThrow("at most");
	});
});

describe("mid-trial", () => {
	test("a Challenge added mid-trial reaches every current Participant's Board in todo and notifies them", async () => {
		const { setup, trialCycleId, alice, bob } = await setUpRunningTrial();

		await addChallenge(setup, trialCycleId, "Ship the demo");

		for (const participant of [alice, bob]) {
			const board = await participant.as.query(api.work.pulses.listBoard, {
				trialCycleId,
			});
			const demo = board.find((pulse) => pulse.title === "Ship the demo");
			expect(demo?.status).toBe("todo");
			expect(board).toHaveLength(2);
			expect(await notificationTitles(participant)).toContain(
				"New Challenge in Build a feature: Ship the demo",
			);
		}
	});

	test("a Participant who left gets no copy of a mid-trial Challenge", async () => {
		const { setup, trialCycleId, alice, bob } = await setUpRunningTrial();
		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});

		await addChallenge(setup, trialCycleId, "Ship the demo");

		expect(await boardTitles(bob, trialCycleId)).toContain("Ship the demo");
		const aliceCopies = await setup.t.run(
			async (ctx) =>
				await ctx.db
					.query("pulses")
					.withIndex("by_trial_and_participant", (q) =>
						q
							.eq("trialCycleId", trialCycleId)
							.eq("participantUserId", alice.userId),
					)
					.take(10),
		);
		expect(aliceCopies.map((pulse) => pulse.title)).toEqual(["Build the API"]);
		expect(await notificationTitles(alice)).not.toContain(
			"New Challenge in Build a feature: Ship the demo",
		);
	});

	test("removing a Challenge mid-trial keeps Participants' copies and notifies them", async () => {
		const { setup, trialCycleId, alice } = await setUpRunningTrial();
		const [apiChallenge] = await setup.founder.as.query(
			api.hiring.challenges.list,
			{ trialCycleId },
		);

		await setup.founder.as.mutation(api.hiring.challenges.remove, {
			challengeId: apiChallenge?._id as Id<"challenges">,
		});

		expect(
			await setup.founder.as.query(api.hiring.challenges.list, {
				trialCycleId,
			}),
		).toEqual([]);
		expect(await boardTitles(alice, trialCycleId)).toEqual(["Build the API"]);
		expect(await notificationTitles(alice)).toContain(
			"Challenge removed from Build a feature: Build the API",
		);
	});

	test("the 21st Challenge is refused mid-trial and no Board changes", async () => {
		const { setup, trialCycleId, alice } = await setUpRunningTrial();
		for (let i = 1; i < MAX_TRIAL_CHALLENGES; i++) {
			await addChallenge(setup, trialCycleId, `Challenge ${i}`);
		}

		await expect(
			addChallenge(setup, trialCycleId, "One too many"),
		).rejects.toThrow("at most");

		expect(await boardTitles(alice, trialCycleId)).toHaveLength(
			MAX_TRIAL_CHALLENGES,
		);
	});
});

describe("after the end", () => {
	test("Challenges can't change after the Trial Cycle closes", async () => {
		const { t, setup, trialCycleId, alice } = await setUpOpenTrial();
		await enterTrial(setup, trialCycleId, alice);
		await advancePast(t, DAY + HOUR);
		const [challenge] = await setup.founder.as.query(
			api.hiring.challenges.list,
			{ trialCycleId },
		);
		await closeWithVerdict(setup, trialCycleId, alice, "passed");

		await expect(addChallenge(setup, trialCycleId, "Too late")).rejects.toThrow(
			"Challenges can't change after the Trial Cycle ends",
		);
		await expect(
			setup.founder.as.mutation(api.hiring.challenges.remove, {
				challengeId: challenge?._id as Id<"challenges">,
			}),
		).rejects.toThrow("Challenges can't change after the Trial Cycle ends");
	});

	test("Challenges can't change after the Trial Cycle is cancelled", async () => {
		const { setup, trialCycleId } = await setUpOpenTrial();
		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		await expect(addChallenge(setup, trialCycleId, "Too late")).rejects.toThrow(
			"Challenges can't change after the Trial Cycle ends",
		);
	});
});

describe("access", () => {
	test("Members can list Challenges but not add or remove them", async () => {
		const { setup, trialCycleId } = await setUpOpenTrial();
		const member = await joinAsMember(setup, "Mia");
		const [challenge] = await setup.founder.as.query(
			api.hiring.challenges.list,
			{ trialCycleId },
		);

		const listed = await member.as.query(api.hiring.challenges.list, {
			trialCycleId,
		});

		expect(listed.map((item) => item.title)).toEqual(["Build the API"]);
		await expect(
			member.as.mutation(api.hiring.challenges.add, {
				trialCycleId,
				title: "Sneaky",
			}),
		).rejects.toThrow();
		await expect(
			member.as.mutation(api.hiring.challenges.remove, {
				challengeId: challenge?._id as Id<"challenges">,
			}),
		).rejects.toThrow();
	});

	test("people outside the Startup cannot add, list or remove Challenges", async () => {
		const { setup, trialCycleId, alice } = await setUpOpenTrial();
		const challengeId = await addChallenge(setup, trialCycleId, "Write docs");

		await expect(
			alice.as.mutation(api.hiring.challenges.add, {
				trialCycleId,
				title: "Sneaky",
			}),
		).rejects.toThrow("not a member");
		await expect(
			alice.as.query(api.hiring.challenges.list, { trialCycleId }),
		).rejects.toThrow("not a member");
		await expect(
			alice.as.mutation(api.hiring.challenges.remove, { challengeId }),
		).rejects.toThrow("not a member");
	});
});
