import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import {
	advancePast,
	createTest,
	createTrial,
	DAY,
	HOUR,
	setUpStartup,
	signUp,
	type TestConvex,
} from "./test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

async function evidenceOf(t: TestConvex, username: string) {
	const profile = await t.query(api.people.users.getByUsername, { username });
	return profile?.evidence;
}

test("an Applicant can withdraw before a decision", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, {
		admission: "application",
	});
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.applications.applyToTrial, { trialCycleId });

	await alice.as.mutation(api.applications.leaveTrial, { trialCycleId });

	const trial = await alice.as.query(api.trialCycles.get, { trialCycleId });
	expect(trial?.myStatus).toBe("withdrawn");
});

test("leaving before the start frees the spot and leaves no record", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { maxContributors: 1 });
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	await alice.as.mutation(api.applications.joinTrial, { trialCycleId });

	await alice.as.mutation(api.applications.leaveTrial, { trialCycleId });
	await bob.as.mutation(api.applications.joinTrial, { trialCycleId });

	expect((await evidenceOf(t, "alice"))?.trialCyclesLeft).toBe(0);
});

test("Leaving a started Trial Cycle is recorded publicly and never takes Score below 0", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.applications.joinTrial, { trialCycleId });
	await advancePast(t, DAY + HOUR);

	await alice.as.mutation(api.applications.leaveTrial, { trialCycleId });

	const evidence = await evidenceOf(t, "alice");
	expect(evidence?.trialCyclesLeft).toBe(1);
	expect(evidence?.score).toBe(0);
});

test("a person gets one attempt per Trial Cycle", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.applications.joinTrial, { trialCycleId });
	await alice.as.mutation(api.applications.leaveTrial, { trialCycleId });

	await expect(
		alice.as.mutation(api.applications.joinTrial, { trialCycleId }),
	).rejects.toThrow("one attempt");
});

test("a free person can hold 3 live entries, and cancelled Trial Cycles free a slot", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trials = [];
	for (let index = 0; index < 4; index += 1) {
		trials.push(await createTrial(setup));
	}
	const alice = await signUp(t, "Alice");
	for (const trialCycleId of trials.slice(0, 3)) {
		await alice.as.mutation(api.applications.joinTrial, { trialCycleId });
	}

	await expect(
		alice.as.mutation(api.applications.joinTrial, { trialCycleId: trials[3] }),
	).rejects.toThrow("Free accounts");

	await setup.founder.as.mutation(api.trialCycles.cancel, {
		trialCycleId: trials[0],
	});
	await alice.as.mutation(api.applications.joinTrial, {
		trialCycleId: trials[3],
	});
});

test("a pro person has no entry limit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice", "pro");

	for (let index = 0; index < 4; index += 1) {
		const trialCycleId = await createTrial(setup);
		await alice.as.mutation(api.applications.joinTrial, { trialCycleId });
	}
});
