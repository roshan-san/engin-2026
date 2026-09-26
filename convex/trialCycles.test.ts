import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import {
	advancePast,
	applicationIdOf,
	createTest,
	createTrial,
	DAY,
	HOUR,
	notificationTitles,
	scoreOf,
	setUpStartup,
	signUp,
	startedTrialWith,
	type TestConvex,
} from "./test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

async function evidenceOf(t: TestConvex, username: string) {
	const profile = await t.query(api.users.getByUsername, { username });
	return profile?.evidence;
}

test("a person can join an open-admission Trial Cycle", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const alice = await signUp(t, "Alice");

	await alice.as.mutation(api.applications.joinTrial, { trialCycleId });

	const trial = await alice.as.query(api.trialCycles.get, { trialCycleId });
	expect(trial?.isParticipant).toBe(true);
});

test("a Trial Cycle with Participants becomes active at its start time", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.applications.joinTrial, { trialCycleId });

	await advancePast(t, DAY + HOUR);

	const trial = await alice.as.query(api.trialCycles.get, { trialCycleId });
	expect(trial?.status).toBe("active");
});

test("a Trial Cycle nobody joined is cancelled at its start time and the Founder is told", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });

	await advancePast(t, DAY + HOUR);

	const trial = await setup.founder.as.query(api.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("cancelled");
	expect(await notificationTitles(setup.founder.as)).toContain(
		"Build a feature was cancelled: nobody joined",
	);
});

test("Participants are told when a Trial Cycle starts", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.applications.joinTrial, { trialCycleId });

	await advancePast(t, DAY + HOUR);

	expect(await notificationTitles(alice.as)).toContain(
		"Build a feature has started",
	);
});

test("a Founder can cancel an active Trial Cycle and Participants are told", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.applications.joinTrial, { trialCycleId });
	await advancePast(t, DAY + HOUR);

	await setup.founder.as.mutation(api.trialCycles.cancel, { trialCycleId });

	const trial = await alice.as.query(api.trialCycles.get, { trialCycleId });
	expect(trial?.status).toBe("cancelled");
	expect(await notificationTitles(alice.as)).toContain(
		"Build a feature was cancelled",
	);
});

test("a cancelled Trial Cycle stays cancelled when its start time passes", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.applications.joinTrial, { trialCycleId });
	await setup.founder.as.mutation(api.trialCycles.cancel, { trialCycleId });

	await advancePast(t, DAY + HOUR);

	const trial = await alice.as.query(api.trialCycles.get, { trialCycleId });
	expect(trial?.status).toBe("cancelled");
});

test("nobody can apply to or join a Trial Cycle after its application deadline", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const openTrial = await createTrial(setup, {
		startsInMs: 2 * DAY,
		applicationDeadlineInMs: DAY,
	});
	const applicationTrial = await createTrial(setup, {
		admission: "application",
		startsInMs: 2 * DAY,
		applicationDeadlineInMs: DAY,
	});
	const alice = await signUp(t, "Alice");

	vi.advanceTimersByTime(DAY + HOUR);

	await expect(
		alice.as.mutation(api.applications.joinTrial, {
			trialCycleId: openTrial,
		}),
	).rejects.toThrow("no longer accepting");
	await expect(
		alice.as.mutation(api.applications.applyToTrial, {
			trialCycleId: applicationTrial,
		}),
	).rejects.toThrow("no longer accepting");
});

test("work stops when a Trial Cycle is cancelled", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	const pulseId = await setup.founder.as.mutation(api.pulses.create, {
		startupId: setup.startupId,
		title: "Write the API",
		trialCycleId,
	});
	await alice.as.mutation(api.pulses.assignToMe, { pulseId });
	await alice.as.mutation(api.pulses.setStatus, { pulseId, status: "done" });

	await setup.founder.as.mutation(api.trialCycles.cancel, { trialCycleId });

	await expect(
		setup.founder.as.mutation(api.pulses.verify, { pulseId }),
	).rejects.toThrow("not active");
	expect(await scoreOf(t, alice.userId)).toBe(0);
	expect((await evidenceOf(t, "alice"))?.trialCyclesLeft).toBe(0);
});

test("pending applications are rejected when a Trial Cycle starts", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, {
		admission: "application",
		startsInMs: DAY,
	});
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	await alice.as.mutation(api.applications.applyToTrial, { trialCycleId });
	await bob.as.mutation(api.applications.applyToTrial, { trialCycleId });
	const aliceApplication = await applicationIdOf(t, trialCycleId, alice.userId);
	await setup.founder.as.mutation(api.applications.decide, {
		applicationId: aliceApplication,
		status: "joined",
	});

	await advancePast(t, DAY + HOUR);

	const trial = await bob.as.query(api.trialCycles.get, { trialCycleId });
	expect(trial?.myStatus).toBe("rejected");
});
