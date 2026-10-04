import { expect, test } from "vitest";
import { api } from "../_generated/api";
import {
	advancePast,
	createTest,
	DAY,
	HOUR,
	type TestConvex,
} from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { createTrial, enterTrial } from "./trialCycles.helpers";

async function evidenceOf(t: TestConvex, username: string) {
	const profile = await t.query(api.people.users.getByUsername, { username });
	return profile?.evidence;
}

test("an Applicant can withdraw before a decision", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.hiring.applications.applyToTrial, {
		acceptTerms: true,
		trialCycleId,
	});

	await alice.as.mutation(api.hiring.applications.leaveTrial, { trialCycleId });

	const trial = await alice.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.myStatus).toBe("withdrawn");
});

test("leaving before the start frees the spot and leaves no record", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { maxContributors: 1 });
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	await enterTrial(setup, trialCycleId, alice);

	await alice.as.mutation(api.hiring.applications.leaveTrial, { trialCycleId });
	await enterTrial(setup, trialCycleId, bob);

	expect((await evidenceOf(t, "alice"))?.trialCyclesLeft).toBe(0);
});

test("Leaving a started Trial Cycle is recorded publicly and never takes Score below 0", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");
	await enterTrial(setup, trialCycleId, alice);
	await advancePast(t, DAY + HOUR);

	await alice.as.mutation(api.hiring.applications.leaveTrial, { trialCycleId });

	const evidence = await evidenceOf(t, "alice");
	expect(evidence?.trialCyclesLeft).toBe(1);
	expect(evidence?.score).toBe(0);
});

test("a person gets one attempt per Trial Cycle", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.hiring.applications.applyToTrial, {
		acceptTerms: true,
		trialCycleId,
	});
	await alice.as.mutation(api.hiring.applications.leaveTrial, { trialCycleId });

	await expect(
		alice.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		}),
	).rejects.toThrow("one attempt");
});

test("a person can hold 5 live entries, and a cancelled Trial Cycle frees a slot", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trials = [];
	for (let index = 0; index < 6; index += 1) {
		trials.push(await createTrial(setup));
	}
	const alice = await signUp(t, "Alice");
	for (const trialCycleId of trials.slice(0, 5)) {
		await alice.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId,
			acceptTerms: true,
		});
	}

	await expect(
		alice.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId: trials[5],
			acceptTerms: true,
		}),
	).rejects.toThrow(
		"You're in 5 hackathons already. Finish or withdraw from one to join another.",
	);

	await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
		trialCycleId: trials[0],
	});
	await alice.as.mutation(api.hiring.applications.applyToTrial, {
		trialCycleId: trials[5],
		acceptTerms: true,
	});
});

test("Pro gives no extra entries", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice", "pro");
	for (let index = 0; index < 5; index += 1) {
		await alice.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId: await createTrial(setup),
			acceptTerms: true,
		});
	}

	await expect(
		alice.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId: await createTrial(setup),
			acceptTerms: true,
		}),
	).rejects.toThrow("You're in 5 hackathons already");
});

test("a startup's own Founders and Members can't enter its hackathon", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const member = await joinAsMember(setup, "Mia");

	await expect(
		setup.founder.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId,
			acceptTerms: true,
		}),
	).rejects.toThrow("on this startup's team");
	await expect(
		member.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId,
			acceptTerms: true,
		}),
	).rejects.toThrow("on this startup's team");
});

test("entering requires the IP acknowledgment, and records when it was given", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const alice = await signUp(t, "Alice");

	await expect(
		alice.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId,
			acceptTerms: false,
		}),
	).rejects.toThrow("IP terms");

	await alice.as.mutation(api.hiring.applications.applyToTrial, {
		trialCycleId,
		acceptTerms: true,
	});
	const application = await t.run(
		async (ctx) =>
			await ctx.db
				.query("applications")
				.withIndex("by_trial_and_user", (q) =>
					q.eq("trialCycleId", trialCycleId).eq("userId", alice.userId),
				)
				.unique(),
	);
	expect(application?.ipAcknowledgedAt).toBeDefined();
});
