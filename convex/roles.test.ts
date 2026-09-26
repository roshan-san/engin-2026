import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import {
	applicationIdOf,
	createTest,
	createTrial,
	DAY,
	notificationTitles,
	setUpStartup,
	signUp,
	startedTrialWith,
} from "./test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("reaching the Headcount fills the Role and tidies up what depended on it", async () => {
	const t = createTest();
	const setup = await setUpStartup(t, 1);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const carol = await signUp(t, "Carol");
	const finishedTrial = await startedTrialWith(t, setup, [alice, bob]);
	const runningTrial = await startedTrialWith(t, setup, [carol]);
	const unstartedTrial = await createTrial(setup, { startsInMs: 5 * DAY });
	await setup.founder.as.mutation(api.trialCycles.close, {
		trialCycleId: finishedTrial,
		verdicts: [
			{
				applicationId: await applicationIdOf(t, finishedTrial, alice.userId),
				verdict: "passed_with_offer",
			},
			{
				applicationId: await applicationIdOf(t, finishedTrial, bob.userId),
				verdict: "passed_with_offer",
			},
		],
		pulseReviews: [],
	});
	const [aliceOffer] = await alice.as.query(api.offers.listMine, {});

	await alice.as.mutation(api.offers.accept, { offerId: aliceOffer._id });

	const roles = await setup.founder.as.query(api.roles.list, {
		startupId: setup.startupId,
	});
	expect(roles[0]?.status).toBe("closed");

	const [bobOffer] = await bob.as.query(api.offers.listMine, {});
	expect(bobOffer?.status).toBe("withdrawn");
	expect(await notificationTitles(bob.as)).toContain(
		"Your Offer from Acme was withdrawn",
	);

	const unstarted = await setup.founder.as.query(api.trialCycles.get, {
		trialCycleId: unstartedTrial,
	});
	expect(unstarted?.status).toBe("cancelled");

	const running = await carol.as.query(api.trialCycles.get, {
		trialCycleId: runningTrial,
	});
	expect(running?.status).toBe("active");
	await expect(
		setup.founder.as.mutation(api.trialCycles.close, {
			trialCycleId: runningTrial,
			verdicts: [
				{
					applicationId: await applicationIdOf(t, runningTrial, carol.userId),
					verdict: "passed_with_offer",
				},
			],
			pulseReviews: [],
		}),
	).rejects.toThrow("Role is filled");
});

test("a Role with Headcount 2 stays open after one accepted Offer", async () => {
	const t = createTest();
	const setup = await setUpStartup(t, 2);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await setup.founder.as.mutation(api.trialCycles.close, {
		trialCycleId,
		verdicts: [
			{
				applicationId: await applicationIdOf(t, trialCycleId, alice.userId),
				verdict: "passed_with_offer",
			},
		],
		pulseReviews: [],
	});
	const [offer] = await alice.as.query(api.offers.listMine, {});

	await alice.as.mutation(api.offers.accept, { offerId: offer._id });

	const roles = await setup.founder.as.query(api.roles.list, {
		startupId: setup.startupId,
	});
	expect(roles[0]?.status).toBe("open");
});

test("a filled Role cannot be reopened", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await setup.founder.as.mutation(api.roles.close, { roleId: setup.roleId });

	const roles = await setup.founder.as.query(api.roles.list, {
		startupId: setup.startupId,
	});
	expect(roles[0]?.status).toBe("closed");
});
