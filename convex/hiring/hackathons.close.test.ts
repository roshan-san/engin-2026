import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, type TestConvex } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { type Person, scoreOf, signUp } from "../people/users.helpers";
import { type Setup, setUpStartup } from "../teams/startups.helpers";
import { submitWithProof } from "../work/cycles.helpers";
import {
	applicationIdOf,
	closeWithVerdict,
	createDraftHackathon,
	createHackathon,
	cycleIdOf,
	startedHackathonWith,
} from "./hackathons.helpers";

async function joinTeamMidHackathon(
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
	test("a Hackathon cannot close until every Participant has a Verdict", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		const hackathonId = await startedHackathonWith(setup, [alice, bob]);

		await expect(
			setup.founder.as.mutation(api.hiring.hackathons.close, {
				hackathonId,
				verdicts: [
					{
						applicationId: await applicationIdOf(t, hackathonId, alice.userId),
						verdict: "passed",
					},
				],
			}),
		).rejects.toThrow("Every Participant needs a Verdict");
	});

	test("only a running Hackathon can close", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);

		await expect(
			setup.founder.as.mutation(api.hiring.hackathons.close, {
				hackathonId,
				verdicts: [],
			}),
		).rejects.toThrow("Only an active Hackathon can be closed");
	});

	test("a filled Role can't make Offers at the close", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		const firstHackathon = await startedHackathonWith(setup, [alice]);
		const secondHackathon = await startedHackathonWith(setup, [bob]);
		await closeWithVerdict(setup, firstHackathon, alice, "passed_with_offer");
		const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
		await alice.as.mutation(api.hiring.offers.accept, {
			offerId: offer?._id as NonNullable<typeof offer>["_id"],
		});

		await expect(
			closeWithVerdict(setup, secondHackathon, bob, "passed_with_offer"),
		).rejects.toThrow("This Role is filled, so it can't make Offers");
	});

	test("My Hackathons carries the Verdict once the Hackathon closes", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		const [before] = await alice.as.query(api.hiring.applications.listMine, {});
		expect(before?.verdict).toBeNull();

		await closeWithVerdict(setup, hackathonId, alice, "passed");

		const [after] = await alice.as.query(api.hiring.applications.listMine, {});
		expect(after?.verdict).toBe("passed");
	});
});

describe("closing with Tasks in Review", () => {
	/** Alice and Bob run a hackathon; Alice has her Starter Task copy in Review. */
	async function setUpReview() {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		const hackathonId = await startedHackathonWith(setup, [alice, bob]);
		const cycleId = await cycleIdOf(t, hackathonId);
		const [task] = await alice.as.query(api.work.tasks.listLane, { cycleId });
		if (!task) {
			throw new Error("Lane is empty");
		}
		await submitWithProof(alice, task._id);

		async function closeWithBob() {
			await setup.founder.as.mutation(api.hiring.hackathons.close, {
				hackathonId,
				verdicts: [
					{
						applicationId: await applicationIdOf(t, hackathonId, bob.userId),
						verdict: "passed",
					},
				],
			});
		}
		async function cycleStatus() {
			const view = await setup.founder.as.query(api.work.cycles.get, {
				cycleId,
			});
			return view?.cycle.status;
		}

		return {
			t,
			setup,
			alice,
			bob,
			hackathonId,
			taskId: task._id,
			closeWithBob,
			cycleStatus,
		};
	}

	test("a Hackathon can't close while a Task is in Review", async () => {
		const { t, setup, alice, bob, hackathonId } = await setUpReview();
		const verdicts = [];
		for (const person of [alice, bob]) {
			verdicts.push({
				applicationId: await applicationIdOf(t, hackathonId, person.userId),
				verdict: "passed" as const,
			});
		}

		await expect(
			setup.founder.as.mutation(api.hiring.hackathons.close, {
				hackathonId,
				verdicts,
			}),
		).rejects.toThrow(
			"Verify or send back every Task in Review before closing",
		);

		const hackathon = await setup.founder.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("active");
	});

	test("a left Participant's Task in Review still blocks the close", async () => {
		const { alice, hackathonId, closeWithBob } = await setUpReview();
		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		await expect(closeWithBob()).rejects.toThrow(
			"Verify or send back every Task in Review before closing",
		);
	});

	test("once Review is empty the Hackathon closes and so does its Cycle", async () => {
		const { setup, alice, hackathonId, taskId, closeWithBob, cycleStatus } =
			await setUpReview();
		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});
		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });

		await closeWithBob();

		expect(await cycleStatus()).toBe("closed");
	});
});

describe("cancelling closes the Cycle", () => {
	const stages = {
		draft: createDraftHackathon,
		open: createHackathon,
		active: async (setup: Setup) =>
			await startedHackathonWith(setup, [await signUp(setup.t, "Alice")]),
	};

	for (const [stage, arrange] of Object.entries(stages)) {
		test(`cancelling a hackathon at ${stage} closes its Cycle`, async () => {
			const t = createTest();
			const setup = await setUpStartup(t);
			const hackathonId = await arrange(setup);

			await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
				hackathonId,
			});

			const view = await setup.founder.as.query(api.work.cycles.get, {
				cycleId: await cycleIdOf(t, hackathonId),
			});
			expect(view?.cycle.status).toBe("closed");
		});
	}
});

describe("Score", () => {
	test("a Hackathon's Verdicts earn Score, and its verified Tasks don't", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		const taskId = await alice.as.mutation(api.work.tasks.create, {
			startupId: setup.startupId,
			title: "Write the API",
			cycleId: await cycleIdOf(t, hackathonId),
		});
		await submitWithProof(alice, taskId);
		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });
		expect(await scoreOf(t, alice.userId)).toBe(0);

		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId,
			verdicts: [
				{
					applicationId: await applicationIdOf(t, hackathonId, alice.userId),
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
		const hackathonId = await startedHackathonWith(setup, [alice, bob]);

		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId,
			verdicts: [
				{
					applicationId: await applicationIdOf(t, hackathonId, alice.userId),
					verdict: "passed",
				},
				{
					applicationId: await applicationIdOf(t, hackathonId, bob.userId),
					verdict: "not_passed",
				},
			],
		});

		expect(await scoreOf(t, alice.userId)).toBe(80);
		expect(await scoreOf(t, bob.userId)).toBe(0);
		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("closed");
		expect(hackathon?.myVerdict).toBe("passed");
		expect(await notificationTitles(bob.as)).toContain(
			"Your Verdict for Build a feature is in",
		);
	});

	test("Leaving a started Hackathon costs 40 Score", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const passedHackathon = await startedHackathonWith(setup, [alice]);
		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId: passedHackathon,
			verdicts: [
				{
					applicationId: await applicationIdOf(
						t,
						passedHackathon,
						alice.userId,
					),
					verdict: "passed",
				},
			],
		});
		const leftHackathon = await startedHackathonWith(setup, [alice]);

		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId: leftHackathon,
		});

		expect(await scoreOf(t, alice.userId)).toBe(40);
	});

	test("someone who joins the team mid-hackathon gets their Verdict but no Score", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		await joinTeamMidHackathon(t, setup, alice.userId);

		await closeWithVerdict(setup, hackathonId, alice, "passed");

		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.myVerdict).toBe("passed");
		expect(await scoreOf(t, alice.userId)).toBe(0);
	});

	test("an Offer accepted by someone already on the team earns no Score", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		await joinTeamMidHackathon(t, setup, alice.userId);
		await closeWithVerdict(setup, hackathonId, alice, "passed_with_offer");

		const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
		await alice.as.mutation(api.hiring.offers.accept, {
			offerId: offer?._id as NonNullable<typeof offer>["_id"],
		});

		expect(await scoreOf(t, alice.userId)).toBe(0);
	});
});

async function historyOf(t: TestConvex, username: string) {
	const profile = await t.query(api.people.users.getByUsername, { username });
	return profile?.hackathonHistory ?? [];
}

describe("evaluations and the profile", () => {
	test("an Evaluation is private until the Participant shows it", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		const applicationId = await applicationIdOf(t, hackathonId, alice.userId);
		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId,
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
		const hackathonId = await startedHackathonWith(setup, [alice]);

		await closeWithVerdict(setup, hackathonId, alice, "passed");

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
		const hackathonId = await startedHackathonWith(setup, [alice]);
		const applicationId = await applicationIdOf(t, hackathonId, alice.userId);

		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId,
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
		const hackathonId = await startedHackathonWith(setup, [bob]);
		await joinTeamMidHackathon(t, setup, bob.userId);

		await closeWithVerdict(setup, hackathonId, bob, "passed");

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
		const hackathonId = await startedHackathonWith(setup, [bob]);
		const applicationId = await applicationIdOf(t, hackathonId, bob.userId);
		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId,
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
		const hackathonId = await startedHackathonWith(setup, [alice]);
		const applicationId = await applicationIdOf(t, hackathonId, alice.userId);
		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId,
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

	test("My Hackathons carries the Evaluation and whether it is shown", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		const applicationId = await applicationIdOf(t, hackathonId, alice.userId);
		await setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId,
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

	test("a Hackathon left after the start is listed as left", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);

		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		expect(
			(await historyOf(t, "alice")).map(({ outcome, earnsScore }) => ({
				outcome,
				earnsScore,
			})),
		).toEqual([{ outcome: "left", earnsScore: false }]);
	});
});
