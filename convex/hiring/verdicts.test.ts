import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import {
	applicationIdOf,
	createTest,
	notificationTitles,
	scoreOf,
	setUpStartup,
	signUp,
	startedTrialWith,
} from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("a Trial Cycle cannot close until every Participant has a Verdict", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const trialCycleId = await startedTrialWith(t, setup, [alice, bob]);

	await expect(
		setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId,
			verdicts: [
				{
					applicationId: await applicationIdOf(t, trialCycleId, alice.userId),
					verdict: "passed",
				},
			],
		}),
	).rejects.toThrow("Every Participant needs a Verdict");
});

test("a Trial Cycle closes with Verdicts alone, and its Pulses earn no Score", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	const pulseId = await setup.founder.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Write the API",
		trialCycleId,
	});
	await alice.as.mutation(api.work.pulses.assignToMe, { pulseId });
	await alice.as.mutation(api.work.pulses.setStatus, {
		pulseId,
		status: "done",
	});

	await setup.founder.as.mutation(api.hiring.trialCycles.close, {
		trialCycleId,
		verdicts: [
			{
				applicationId: await applicationIdOf(t, trialCycleId, alice.userId),
				verdict: "passed",
			},
		],
	});

	expect(await scoreOf(t, alice.userId)).toBe(80);
});

test("a passed Verdict earns 80 Score and not passed earns nothing", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const trialCycleId = await startedTrialWith(t, setup, [alice, bob]);

	await setup.founder.as.mutation(api.hiring.trialCycles.close, {
		trialCycleId,
		verdicts: [
			{
				applicationId: await applicationIdOf(t, trialCycleId, alice.userId),
				verdict: "passed",
			},
			{
				applicationId: await applicationIdOf(t, trialCycleId, bob.userId),
				verdict: "not_passed",
			},
		],
	});

	expect(await scoreOf(t, alice.userId)).toBe(80);
	expect(await scoreOf(t, bob.userId)).toBe(0);
	const trial = await alice.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("closed");
	expect(trial?.myVerdict).toBe("passed");
	expect(await notificationTitles(bob.as)).toContain(
		"Your Verdict for Build a feature is in",
	);
});

test("Leaving a started Trial Cycle costs 40 Score", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const passedTrial = await startedTrialWith(t, setup, [alice]);
	await setup.founder.as.mutation(api.hiring.trialCycles.close, {
		trialCycleId: passedTrial,
		verdicts: [
			{
				applicationId: await applicationIdOf(t, passedTrial, alice.userId),
				verdict: "passed",
			},
		],
	});
	const leftTrial = await startedTrialWith(t, setup, [alice]);

	await alice.as.mutation(api.hiring.applications.leaveTrial, {
		trialCycleId: leftTrial,
	});

	expect(await scoreOf(t, alice.userId)).toBe(40);
});

test("an Evaluation is private until the Participant shows it", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	const applicationId = await applicationIdOf(t, trialCycleId, alice.userId);
	await setup.founder.as.mutation(api.hiring.trialCycles.close, {
		trialCycleId,
		verdicts: [{ applicationId, verdict: "passed", evaluation: "Sharp work" }],
	});

	const before = await t.query(api.people.users.getByUsername, {
		username: "alice",
	});
	expect(before?.evaluations).toEqual([]);

	await alice.as.mutation(api.hiring.applications.setEvaluationVisibility, {
		applicationId,
		isPublic: true,
	});

	const after = await t.query(api.people.users.getByUsername, {
		username: "alice",
	});
	expect(after?.evaluations.map((item) => item.evaluation)).toEqual([
		"Sharp work",
	]);
});
