import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { MAX_TRIAL_APPLICATIONS } from "../lib/limits";
import {
	advancePast,
	type Client,
	createTest,
	DAY,
	HOUR,
	type TestConvex,
} from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import {
	LIVE_ENTRY_LIMIT_MESSAGE,
	ONE_ATTEMPT_MESSAGE,
	TEAM_ENTRY_MESSAGE,
	TRIAL_FULL_MESSAGE,
} from "./applications.rules";
import { IP_TERMS_MESSAGE } from "./ipTerms.rules";
import {
	applicationIdOf,
	closeWithVerdict,
	createTrial,
	enterTrial,
	startedTrialWith,
} from "./trialCycles.helpers";

async function evidenceOf(t: TestConvex, username: string) {
	const profile = await t.query(api.people.users.getByUsername, { username });
	return profile?.evidence;
}

describe("withdrawing and leaving", () => {
	test("an Applicant can withdraw before a decision", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);
		const alice = await signUp(t, "Alice");
		await alice.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		});

		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});

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

		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});
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

		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});

		const evidence = await evidenceOf(t, "alice");
		expect(evidence?.trialCyclesLeft).toBe(1);
		expect(evidence?.score).toBe(0);
	});

	test("leaving a running hackathon marks the entry Left, frees the spot and tells the founders", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);

		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});

		const trial = await alice.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.myStatus).toBe("left");
		expect(trial?.participantCount).toBe(0);
		expect(await notificationTitles(setup.founder.as)).toContain(
			"A Participant left Build a feature",
		);
	});

	test("leaving a closed hackathon is refused", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
		await advancePast(t, 8 * DAY);
		await closeWithVerdict(setup, trialCycleId, alice, "passed");

		await expect(
			alice.as.mutation(api.hiring.applications.leaveTrial, { trialCycleId }),
		).rejects.toThrow("You are not in this Trial Cycle");
	});
});

describe("entry rules", () => {
	test("a person gets one attempt per Trial Cycle", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);
		const alice = await signUp(t, "Alice");
		await alice.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		});
		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});

		await expect(
			alice.as.mutation(api.hiring.applications.applyToTrial, {
				acceptTerms: true,
				trialCycleId,
			}),
		).rejects.toThrow(ONE_ATTEMPT_MESSAGE);
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
		).rejects.toThrow(LIVE_ENTRY_LIMIT_MESSAGE);

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
		).rejects.toThrow(LIVE_ENTRY_LIMIT_MESSAGE);
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
		).rejects.toThrow(TEAM_ENTRY_MESSAGE);
		await expect(
			member.as.mutation(api.hiring.applications.applyToTrial, {
				trialCycleId,
				acceptTerms: true,
			}),
		).rejects.toThrow(TEAM_ENTRY_MESSAGE);
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
		).rejects.toThrow(IP_TERMS_MESSAGE);

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

	test("applying to a hackathon with every Participant spot taken is refused as full", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { maxContributors: 1 });
		await enterTrial(setup, trialCycleId, await signUp(t, "Bob"));
		const alice = await signUp(t, "Alice");

		await expect(
			alice.as.mutation(api.hiring.applications.applyToTrial, {
				trialCycleId,
				acceptTerms: true,
			}),
		).rejects.toThrow(TRIAL_FULL_MESSAGE);
	});

	test("applying to a hackathon with 50 applications is refused as full", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);
		await t.run(async (ctx) => {
			const trial = await ctx.db.get(trialCycleId);
			if (!trial) {
				throw new Error("No trial");
			}
			for (let index = 0; index < MAX_TRIAL_APPLICATIONS; index += 1) {
				const userId = await ctx.db.insert("users", {
					name: `Applicant ${index}`,
				});
				await ctx.db.insert("applications", {
					userId,
					startupId: trial.startupId,
					roleId: trial.roleId,
					trialCycleId,
					status: index % 2 === 0 ? "applied" : "withdrawn",
				});
			}
		});
		const alice = await signUp(t, "Alice");

		await expect(
			alice.as.mutation(api.hiring.applications.applyToTrial, {
				trialCycleId,
				acceptTerms: true,
			}),
		).rejects.toThrow(TRIAL_FULL_MESSAGE);
	});

	test("applying after the application deadline is refused", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, {
			applicationDeadlineInMs: HOUR,
			startsInMs: DAY,
		});
		const alice = await signUp(t, "Alice");
		await advancePast(t, 2 * HOUR);

		await expect(
			alice.as.mutation(api.hiring.applications.applyToTrial, {
				trialCycleId,
				acceptTerms: true,
			}),
		).rejects.toThrow("This Trial Cycle is no longer accepting people");
	});
});

describe("admission", () => {
	async function setUpApplicant() {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		const applicationId = await alice.as.mutation(
			api.hiring.applications.applyToTrial,
			{ trialCycleId, acceptTerms: true },
		);
		return { t, setup, trialCycleId, alice, applicationId };
	}

	async function notificationTitlesOf(as: Client) {
		const { notifications } = await as.query(api.people.notifications.list, {});
		return notifications.map((notification) => notification.title);
	}

	test("accepting an Applicant makes them a Participant, takes a spot and notifies them", async () => {
		const { setup, trialCycleId, alice, applicationId } =
			await setUpApplicant();

		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId,
			status: "joined",
		});

		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.participantCount).toBe(1);
		expect(trial?.applicants.map((applicant) => applicant.status)).toEqual([
			"joined",
		]);
		expect(await notificationTitlesOf(alice.as)).toContain(
			"You were accepted to Build a feature",
		);
	});

	test("rejecting an Applicant notifies them and frees their live entry", async () => {
		const { setup, alice, applicationId } = await setUpApplicant();

		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId,
			status: "rejected",
		});

		const [entry] = await alice.as.query(api.hiring.applications.listMine, {});
		expect(entry?.status).toBe("rejected");
		expect(entry?.isLive).toBe(false);
		expect(await notificationTitlesOf(alice.as)).toContain(
			"Your application to Build a feature was not accepted",
		);
	});

	test("accepting when every spot is taken is refused as full and the Applicant stays pending", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { maxContributors: 2 });
		const alice = await signUp(t, "Alice");
		const applicationId = await alice.as.mutation(
			api.hiring.applications.applyToTrial,
			{ trialCycleId, acceptTerms: true },
		);
		await enterTrial(setup, trialCycleId, await signUp(t, "Bob"));
		await enterTrial(setup, trialCycleId, await signUp(t, "Cara"));

		await expect(
			setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId,
				status: "joined",
			}),
		).rejects.toThrow(TRIAL_FULL_MESSAGE);

		const [entry] = await alice.as.query(api.hiring.applications.listMine, {});
		expect(entry?.status).toBe("applied");
	});

	test("an application can be decided only once", async () => {
		const { setup, applicationId } = await setUpApplicant();
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId,
			status: "rejected",
		});

		await expect(
			setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId,
				status: "joined",
			}),
		).rejects.toThrow("This application has already been decided");
	});

	test("no decisions once the hackathon is no longer open", async () => {
		const { setup, trialCycleId, applicationId } = await setUpApplicant();
		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		await expect(
			setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId,
				status: "joined",
			}),
		).rejects.toThrow("This Trial Cycle is no longer accepting people");
	});

	test("Members who aren't Founders cannot decide applications", async () => {
		const { setup, applicationId } = await setUpApplicant();
		const member = await joinAsMember(setup, "Mia");

		await expect(
			member.as.mutation(api.hiring.applications.decide, {
				applicationId,
				status: "joined",
			}),
		).rejects.toThrow();
	});
});

describe("my entries", () => {
	test("each entry carries its hackathon's status and dates, and only applied or accepted ones in a live hackathon are live", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const applied = await createTrial(setup);
		const rejected = await createTrial(setup);
		const withdrawn = await createTrial(setup);
		const cancelled = await createTrial(setup);
		const alice = await signUp(t, "Alice");
		for (const trialCycleId of [applied, rejected, withdrawn, cancelled]) {
			await alice.as.mutation(api.hiring.applications.applyToTrial, {
				trialCycleId,
				acceptTerms: true,
			});
		}
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: await applicationIdOf(t, rejected, alice.userId),
			status: "rejected",
		});
		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId: withdrawn,
		});
		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId: cancelled,
		});

		const entries = await alice.as.query(api.hiring.applications.listMine, {});

		const byTrial = new Map(
			entries.map((entry) => [entry.trialCycleId, entry]),
		);
		expect(byTrial.get(applied)).toMatchObject({
			status: "applied",
			trialStatus: "open",
			isLive: true,
		});
		expect(byTrial.get(applied)?.startsAt).toBeTypeOf("number");
		expect(byTrial.get(applied)?.endsAt).toBeTypeOf("number");
		expect(byTrial.get(rejected)).toMatchObject({
			status: "rejected",
			isLive: false,
		});
		expect(byTrial.get(withdrawn)).toMatchObject({
			status: "withdrawn",
			isLive: false,
		});
		expect(byTrial.get(cancelled)).toMatchObject({
			status: "applied",
			trialStatus: "cancelled",
			isLive: false,
		});
	});
});
