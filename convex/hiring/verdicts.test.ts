import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import {
	applicationIdOf,
	closeWithVerdict,
	createTest,
	notificationTitles,
	scoreOf,
	setUpStartup,
	signUp,
	startedTrialWith,
	type TestConvex,
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
	const pulseId = await alice.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Write the API",
		trialCycleId,
	});
	await alice.as.mutation(api.work.pulses.setStatus, {
		pulseId,
		status: "done",
	});
	expect(await scoreOf(t, alice.userId)).toBe(0);

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

async function joinTeamMidTrial(
	t: TestConvex,
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	userId: Awaited<ReturnType<typeof signUp>>["userId"],
) {
	await t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: setup.startupId,
			userId,
			role: "member",
		});
	});
}

test("someone who joins the team mid-trial gets their Verdict but no Score", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await joinTeamMidTrial(t, setup, alice.userId);

	await closeWithVerdict(t, setup, trialCycleId, alice, "passed");

	const trial = await alice.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.myVerdict).toBe("passed");
	expect(await scoreOf(t, alice.userId)).toBe(0);
});

test("an Offer accepted by someone already on the team earns no Score", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await joinTeamMidTrial(t, setup, alice.userId);
	await closeWithVerdict(t, setup, trialCycleId, alice, "passed_with_offer");

	const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
	await alice.as.mutation(api.hiring.offers.accept, {
		offerId: offer?._id as NonNullable<typeof offer>["_id"],
	});

	expect(await scoreOf(t, alice.userId)).toBe(0);
});

test("a passed Verdict shows on the profile with the startup that issued it", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);

	await closeWithVerdict(t, setup, trialCycleId, alice, "passed");

	const profile = await t.query(api.people.users.getByUsername, {
		username: "alice",
	});
	expect(
		profile?.verdicts.map(({ startupName, verdict }) => ({
			startupName,
			verdict,
		})),
	).toEqual([{ startupName: "Acme", verdict: "passed" }]);
});

test("Verdicts that earn no Score aren't listed on the profile", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const trialCycleId = await startedTrialWith(t, setup, [alice, bob]);
	await joinTeamMidTrial(t, setup, bob.userId);

	await setup.founder.as.mutation(api.hiring.trialCycles.close, {
		trialCycleId,
		verdicts: [
			{
				applicationId: await applicationIdOf(t, trialCycleId, alice.userId),
				verdict: "not_passed",
			},
			{
				applicationId: await applicationIdOf(t, trialCycleId, bob.userId),
				verdict: "passed",
			},
		],
	});

	for (const username of ["alice", "bob"]) {
		const profile = await t.query(api.people.users.getByUsername, {
			username,
		});
		expect(profile?.verdicts).toEqual([]);
	}
});
