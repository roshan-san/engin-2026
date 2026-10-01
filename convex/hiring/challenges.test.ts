import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import { MAX_TRIAL_CHALLENGES } from "../lib/limits";
import {
	advancePast,
	createTest,
	createTrial,
	DAY,
	HOUR,
	setUpStartup,
	signUp,
} from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

async function setUpOpenTrial() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	return { t, setup, trialCycleId, alice, bob };
}

async function addChallenge(
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	trialCycleId: Awaited<ReturnType<typeof createTrial>>,
	title: string,
) {
	return await setup.founder.as.mutation(api.hiring.challenges.add, {
		trialCycleId,
		title,
		description: `Do: ${title}`,
	});
}

test("starting a Trial Cycle copies every Challenge onto each Participant's Board in todo", async () => {
	const { t, setup, trialCycleId, alice, bob } = await setUpOpenTrial();
	await addChallenge(setup, trialCycleId, "Build the API");
	await addChallenge(setup, trialCycleId, "Write the docs");
	await alice.as.mutation(api.hiring.applications.joinTrial, {
		acceptTerms: true,
		trialCycleId,
	});
	await bob.as.mutation(api.hiring.applications.joinTrial, {
		acceptTerms: true,
		trialCycleId,
	});

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
	await addChallenge(setup, trialCycleId, "Build the API");
	const docsId = await addChallenge(setup, trialCycleId, "Write the docs");

	await setup.founder.as.mutation(api.hiring.challenges.remove, {
		challengeId: docsId,
	});

	const challenges = await setup.founder.as.query(api.hiring.challenges.list, {
		trialCycleId,
	});
	expect(challenges.map((challenge) => challenge.title)).toEqual([
		"Build the API",
	]);
});

test("only Founders of the Startup can add, list or remove Challenges", async () => {
	const { setup, trialCycleId, alice } = await setUpOpenTrial();
	const challengeId = await addChallenge(setup, trialCycleId, "Build the API");

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

test("Challenges cannot be added once the Trial Cycle has started", async () => {
	const { t, setup, trialCycleId, alice } = await setUpOpenTrial();
	await alice.as.mutation(api.hiring.applications.joinTrial, {
		acceptTerms: true,
		trialCycleId,
	});
	await advancePast(t, DAY + HOUR);

	await expect(addChallenge(setup, trialCycleId, "Too late")).rejects.toThrow(
		"before the Trial Cycle starts",
	);
});

test("a Trial Cycle has a bounded number of Challenges", async () => {
	const { setup, trialCycleId } = await setUpOpenTrial();
	for (let i = 0; i < MAX_TRIAL_CHALLENGES; i++) {
		await addChallenge(setup, trialCycleId, `Challenge ${i}`);
	}

	await expect(
		addChallenge(setup, trialCycleId, "One too many"),
	).rejects.toThrow("at most");
});
