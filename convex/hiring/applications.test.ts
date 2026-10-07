import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { MAX_HACKATHON_APPLICATIONS } from "../lib/limits";
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
	HACKATHON_FULL_MESSAGE,
} from "./applications.rules";
import { IP_TERMS_MESSAGE } from "./ipTerms.rules";
import {
	applicationIdOf,
	closeWithVerdict,
	createHackathon,
	enterHackathon,
	startedHackathonWith,
} from "./hackathons.helpers";

async function evidenceOf(t: TestConvex, username: string) {
	const profile = await t.query(api.people.users.getByUsername, { username });
	return profile?.evidence;
}

describe("withdrawing and leaving", () => {
	test("an Applicant can withdraw before a decision", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");
		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});

		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.myStatus).toBe("withdrawn");
	});

	test("leaving before the start frees the spot and leaves no record", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { maxParticipants: 1 });
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		await enterHackathon(setup, hackathonId, alice);

		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});
		await enterHackathon(setup, hackathonId, bob);

		expect((await evidenceOf(t, "alice"))?.hackathonsLeft).toBe(0);
	});

	test("Leaving a started Hackathon is recorded publicly and never takes Score below 0", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterHackathon(setup, hackathonId, alice);
		await advancePast(t, DAY + HOUR);

		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		const evidence = await evidenceOf(t, "alice");
		expect(evidence?.hackathonsLeft).toBe(1);
		expect(evidence?.score).toBe(0);
	});

	test("leaving a running hackathon marks the entry Left, frees the spot and tells the founders", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);

		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.myStatus).toBe("left");
		expect(hackathon?.participantCount).toBe(0);
		expect(await notificationTitles(setup.founder.as)).toContain(
			"A Participant left Build a feature",
		);
	});

	test("leaving a closed hackathon is refused", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		await advancePast(t, 8 * DAY);
		await closeWithVerdict(setup, hackathonId, alice, "passed");

		await expect(
			alice.as.mutation(api.hiring.applications.leaveHackathon, {
				hackathonId,
			}),
		).rejects.toThrow("You are not in this Hackathon");
	});
});

describe("entry rules", () => {
	test("a person gets one attempt per Hackathon", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");
		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});
		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId,
		});

		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				acceptTerms: true,
				hackathonId,
			}),
		).rejects.toThrow(ONE_ATTEMPT_MESSAGE);
	});

	test("a person can hold 5 live entries, and a cancelled Hackathon frees a slot", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathons = [];
		for (let index = 0; index < 6; index += 1) {
			hackathons.push(await createHackathon(setup));
		}
		const alice = await signUp(t, "Alice");
		for (const hackathonId of hackathons.slice(0, 5)) {
			await alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId,
				acceptTerms: true,
			});
		}

		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId: hackathons[5],
				acceptTerms: true,
			}),
		).rejects.toThrow(LIVE_ENTRY_LIMIT_MESSAGE);

		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId: hackathons[0],
		});
		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			hackathonId: hackathons[5],
			acceptTerms: true,
		});
	});

	test("Pro gives no extra entries", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice", "pro");
		for (let index = 0; index < 5; index += 1) {
			await alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId: await createHackathon(setup),
				acceptTerms: true,
			});
		}

		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId: await createHackathon(setup),
				acceptTerms: true,
			}),
		).rejects.toThrow(LIVE_ENTRY_LIMIT_MESSAGE);
	});

	test("a startup's own Founders and Members can't enter its hackathon", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const member = await joinAsMember(setup, "Mia");

		await expect(
			setup.founder.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId,
				acceptTerms: true,
			}),
		).rejects.toThrow(TEAM_ENTRY_MESSAGE);
		await expect(
			member.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId,
				acceptTerms: true,
			}),
		).rejects.toThrow(TEAM_ENTRY_MESSAGE);
	});

	test("entering requires the IP acknowledgment, and records when it was given", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");

		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId,
				acceptTerms: false,
			}),
		).rejects.toThrow(IP_TERMS_MESSAGE);

		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			hackathonId,
			acceptTerms: true,
		});
		const application = await t.run(
			async (ctx) =>
				await ctx.db
					.query("applications")
					.withIndex("by_hackathon_and_user", (q) =>
						q.eq("hackathonId", hackathonId).eq("userId", alice.userId),
					)
					.unique(),
		);
		expect(application?.ipAcknowledgedAt).toBeDefined();
	});

	test("applying to a hackathon with every Participant spot taken is refused as full", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { maxParticipants: 1 });
		await enterHackathon(setup, hackathonId, await signUp(t, "Bob"));
		const alice = await signUp(t, "Alice");

		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId,
				acceptTerms: true,
			}),
		).rejects.toThrow(HACKATHON_FULL_MESSAGE);
	});

	test("applying to a hackathon with 50 applications is refused as full", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		await t.run(async (ctx) => {
			const hackathon = await ctx.db.get(hackathonId);
			if (!hackathon) {
				throw new Error("No hackathon");
			}
			for (let index = 0; index < MAX_HACKATHON_APPLICATIONS; index += 1) {
				const userId = await ctx.db.insert("users", {
					name: `Applicant ${index}`,
				});
				await ctx.db.insert("applications", {
					userId,
					startupId: hackathon.startupId,
					roleId: hackathon.roleId,
					hackathonId,
					status: index % 2 === 0 ? "applied" : "withdrawn",
				});
			}
		});
		const alice = await signUp(t, "Alice");

		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId,
				acceptTerms: true,
			}),
		).rejects.toThrow(HACKATHON_FULL_MESSAGE);
	});

	test("applying after the application deadline is refused", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, {
			applicationDeadlineInMs: HOUR,
			startsInMs: DAY,
		});
		const alice = await signUp(t, "Alice");
		await advancePast(t, 2 * HOUR);

		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId,
				acceptTerms: true,
			}),
		).rejects.toThrow("This Hackathon is no longer accepting people");
	});
});

describe("admission", () => {
	async function setUpApplicant() {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		const applicationId = await alice.as.mutation(
			api.hiring.applications.applyToHackathon,
			{ hackathonId, acceptTerms: true },
		);
		return { t, setup, hackathonId, alice, applicationId };
	}

	async function notificationTitlesOf(as: Client) {
		const { notifications } = await as.query(api.people.notifications.list, {});
		return notifications.map((notification) => notification.title);
	}

	test("accepting an Applicant makes them a Participant, takes a spot and notifies them", async () => {
		const { setup, hackathonId, alice, applicationId } = await setUpApplicant();

		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId,
			status: "accepted",
		});

		const hackathon = await setup.founder.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.participantCount).toBe(1);
		expect(hackathon?.applicants.map((applicant) => applicant.status)).toEqual([
			"accepted",
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
		const hackathonId = await createHackathon(setup, { maxParticipants: 2 });
		const alice = await signUp(t, "Alice");
		const applicationId = await alice.as.mutation(
			api.hiring.applications.applyToHackathon,
			{ hackathonId, acceptTerms: true },
		);
		await enterHackathon(setup, hackathonId, await signUp(t, "Bob"));
		await enterHackathon(setup, hackathonId, await signUp(t, "Cara"));

		await expect(
			setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId,
				status: "accepted",
			}),
		).rejects.toThrow(HACKATHON_FULL_MESSAGE);

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
				status: "accepted",
			}),
		).rejects.toThrow("This application has already been decided");
	});

	test("no decisions once the hackathon is no longer open", async () => {
		const { setup, hackathonId, applicationId } = await setUpApplicant();
		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		await expect(
			setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId,
				status: "accepted",
			}),
		).rejects.toThrow("This Hackathon is no longer accepting people");
	});

	test("Members who aren't Founders cannot decide applications", async () => {
		const { setup, applicationId } = await setUpApplicant();
		const member = await joinAsMember(setup, "Mia");

		await expect(
			member.as.mutation(api.hiring.applications.decide, {
				applicationId,
				status: "accepted",
			}),
		).rejects.toThrow();
	});
});

describe("my hackathons", () => {
	test("each entry carries its hackathon's status and dates, and only applied or accepted ones in a live hackathon are live", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const applied = await createHackathon(setup);
		const rejected = await createHackathon(setup);
		const withdrawn = await createHackathon(setup);
		const cancelled = await createHackathon(setup);
		const alice = await signUp(t, "Alice");
		for (const hackathonId of [applied, rejected, withdrawn, cancelled]) {
			await alice.as.mutation(api.hiring.applications.applyToHackathon, {
				hackathonId,
				acceptTerms: true,
			});
		}
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: await applicationIdOf(t, rejected, alice.userId),
			status: "rejected",
		});
		await alice.as.mutation(api.hiring.applications.leaveHackathon, {
			hackathonId: withdrawn,
		});
		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId: cancelled,
		});

		const entries = await alice.as.query(api.hiring.applications.listMine, {});

		const byHackathon = new Map(
			entries.map((entry) => [entry.hackathonId, entry]),
		);
		expect(byHackathon.get(applied)).toMatchObject({
			status: "applied",
			hackathonStatus: "open",
			isLive: true,
		});
		expect(byHackathon.get(applied)?.startsAt).toBeTypeOf("number");
		expect(byHackathon.get(applied)?.endsAt).toBeTypeOf("number");
		expect(byHackathon.get(rejected)).toMatchObject({
			status: "rejected",
			isLive: false,
		});
		expect(byHackathon.get(withdrawn)).toMatchObject({
			status: "withdrawn",
			isLive: false,
		});
		expect(byHackathon.get(cancelled)).toMatchObject({
			status: "applied",
			hackathonStatus: "cancelled",
			isLive: false,
		});
	});
});
