import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, type TestConvex } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { type Person, scoreOf, signUp } from "../people/users.helpers";
import { type Setup, setUpStartup } from "../teams/startups.helpers";
import {
	applicationIdOf,
	closeWithVerdict,
	createTrial,
	startedTrialWith,
} from "./trialCycles.helpers";

async function joinTeamMidTrial(
	t: TestConvex,
	setup: Setup,
	userId: Person["userId"],
) {
	await t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: setup.startupId,
			userId,
			role: "member",
		});
	});
}

describe("closing", () => {
	test("a Trial Cycle cannot close until every Participant has a Verdict", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		const trialCycleId = await startedTrialWith(setup, [alice, bob]);

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

	test("only a running Trial Cycle can close", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);

		await expect(
			setup.founder.as.mutation(api.hiring.trialCycles.close, {
				trialCycleId,
				verdicts: [],
			}),
		).rejects.toThrow("Only an active Trial Cycle can be closed");
	});

	test("a filled Role can't make Offers at the close", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		const firstTrial = await startedTrialWith(setup, [alice]);
		const secondTrial = await startedTrialWith(setup, [bob]);
		await closeWithVerdict(setup, firstTrial, alice, "passed_with_offer");
		const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
		await alice.as.mutation(api.hiring.offers.accept, {
			offerId: offer?._id as NonNullable<typeof offer>["_id"],
		});

		await expect(
			closeWithVerdict(setup, secondTrial, bob, "passed_with_offer"),
		).rejects.toThrow("This Role is filled, so it can't make Offers");
	});

	test("My Entries carries the Verdict once the Trial Cycle closes", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
		const [before] = await alice.as.query(api.hiring.applications.listMine, {});
		expect(before?.verdict).toBeNull();

		await closeWithVerdict(setup, trialCycleId, alice, "passed");

		const [after] = await alice.as.query(api.hiring.applications.listMine, {});
		expect(after?.verdict).toBe("passed");
	});
});

describe("Score", () => {
	test("a Trial Cycle closes with Verdicts alone, and its Pulses earn no Score", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
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
		const trialCycleId = await startedTrialWith(setup, [alice, bob]);

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
		const passedTrial = await startedTrialWith(setup, [alice]);
		await setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId: passedTrial,
			verdicts: [
				{
					applicationId: await applicationIdOf(t, passedTrial, alice.userId),
					verdict: "passed",
				},
			],
		});
		const leftTrial = await startedTrialWith(setup, [alice]);

		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId: leftTrial,
		});

		expect(await scoreOf(t, alice.userId)).toBe(40);
	});

	test("someone who joins the team mid-trial gets their Verdict but no Score", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
		await joinTeamMidTrial(t, setup, alice.userId);

		await closeWithVerdict(setup, trialCycleId, alice, "passed");

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
		const trialCycleId = await startedTrialWith(setup, [alice]);
		await joinTeamMidTrial(t, setup, alice.userId);
		await closeWithVerdict(setup, trialCycleId, alice, "passed_with_offer");

		const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
		await alice.as.mutation(api.hiring.offers.accept, {
			offerId: offer?._id as NonNullable<typeof offer>["_id"],
		});

		expect(await scoreOf(t, alice.userId)).toBe(0);
	});
});

async function historyOf(t: TestConvex, username: string) {
	const profile = await t.query(api.people.users.getByUsername, { username });
	return profile?.trialHistory ?? [];
}

describe("evaluations and the profile", () => {
	test("an Evaluation is private until the Participant shows it", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
		const applicationId = await applicationIdOf(t, trialCycleId, alice.userId);
		await setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId,
			verdicts: [
				{ applicationId, verdict: "passed", evaluation: "Sharp work" },
			],
		});
		expect(
			(await historyOf(t, "alice")).map((item) => item.evaluation),
		).toEqual([null]);

		await alice.as.mutation(api.hiring.applications.setEvaluationVisibility, {
			applicationId,
			isPublic: true,
		});

		expect(
			(await historyOf(t, "alice")).map((item) => item.evaluation),
		).toEqual(["Sharp work"]);
	});

	test("a passed Verdict shows on the profile with the startup that issued it", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);

		await closeWithVerdict(setup, trialCycleId, alice, "passed");

		expect(
			(await historyOf(t, "alice")).map(
				({ startupName, outcome, earnsScore }) => ({
					startupName,
					outcome,
					earnsScore,
				}),
			),
		).toEqual([{ startupName: "Acme", outcome: "passed", earnsScore: true }]);
	});

	test("a not passed Verdict without a shown Evaluation isn't listed", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
		const applicationId = await applicationIdOf(t, trialCycleId, alice.userId);

		await setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId,
			verdicts: [
				{ applicationId, verdict: "not_passed", evaluation: "Not yet" },
			],
		});

		expect(await historyOf(t, "alice")).toEqual([]);
	});

	test("a passed Verdict for a team member is listed without Score", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const bob = await signUp(t, "Bob");
		const trialCycleId = await startedTrialWith(setup, [bob]);
		await joinTeamMidTrial(t, setup, bob.userId);

		await closeWithVerdict(setup, trialCycleId, bob, "passed");

		expect(
			(await historyOf(t, "bob")).map(({ outcome, earnsScore }) => ({
				outcome,
				earnsScore,
			})),
		).toEqual([{ outcome: "passed", earnsScore: false }]);
	});

	test("a shown Evaluation lists a not passed Verdict with its text", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const bob = await signUp(t, "Bob");
		const trialCycleId = await startedTrialWith(setup, [bob]);
		const applicationId = await applicationIdOf(t, trialCycleId, bob.userId);
		await setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId,
			verdicts: [
				{ applicationId, verdict: "not_passed", evaluation: "Close call" },
			],
		});

		await bob.as.mutation(api.hiring.applications.setEvaluationVisibility, {
			applicationId,
			isPublic: true,
		});

		expect(
			(await historyOf(t, "bob")).map(
				({ outcome, earnsScore, evaluation }) => ({
					outcome,
					earnsScore,
					evaluation,
				}),
			),
		).toEqual([
			{ outcome: "not_passed", earnsScore: false, evaluation: "Close call" },
		]);
	});

	test("a passed Verdict with a shown Evaluation is listed once", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
		const applicationId = await applicationIdOf(t, trialCycleId, alice.userId);
		await setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId,
			verdicts: [
				{ applicationId, verdict: "passed", evaluation: "Sharp work" },
			],
		});

		await alice.as.mutation(api.hiring.applications.setEvaluationVisibility, {
			applicationId,
			isPublic: true,
		});

		expect(
			(await historyOf(t, "alice")).map(({ outcome, evaluation }) => ({
				outcome,
				evaluation,
			})),
		).toEqual([{ outcome: "passed", evaluation: "Sharp work" }]);
	});

	test("My Entries carries the Evaluation and whether it is shown", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
		const applicationId = await applicationIdOf(t, trialCycleId, alice.userId);
		await setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId,
			verdicts: [
				{ applicationId, verdict: "passed", evaluation: "Sharp work" },
			],
		});
		const [before] = await alice.as.query(api.hiring.applications.listMine, {});
		expect(before).toMatchObject({
			evaluation: "Sharp work",
			evaluationPublic: false,
		});

		await alice.as.mutation(api.hiring.applications.setEvaluationVisibility, {
			applicationId,
			isPublic: true,
		});

		const [after] = await alice.as.query(api.hiring.applications.listMine, {});
		expect(after).toMatchObject({
			evaluation: "Sharp work",
			evaluationPublic: true,
		});
	});

	test("a Trial Cycle left after the start is listed as left", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);

		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});

		expect(
			(await historyOf(t, "alice")).map(({ outcome, earnsScore }) => ({
				outcome,
				earnsScore,
			})),
		).toEqual([{ outcome: "left", earnsScore: false }]);
	});
});
