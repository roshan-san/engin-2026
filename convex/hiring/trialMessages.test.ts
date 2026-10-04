import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { advancePast, createTest, DAY } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { createTrial, startedTrialWith } from "./trialCycles.helpers";

async function trialWithTwoParticipants() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const trialCycleId = await startedTrialWith(setup, [alice, bob]);
	return { t, setup, alice, bob, trialCycleId };
}

function bodies(messages: { body: string }[]) {
	return messages.map((message) => message.body);
}

describe("Threads", () => {
	test("a Participant cannot read another Participant's Thread", async () => {
		const { setup, alice, bob, trialCycleId } =
			await trialWithTwoParticipants();
		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "Alice's private question",
		});
		await setup.founder.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			participantUserId: alice.userId,
			body: "Alice's private answer",
		});

		const bobsView = await bob.as.query(api.hiring.trialMessages.list, {
			trialCycleId,
		});
		expect(bobsView).toEqual([]);
		await expect(
			bob.as.query(api.hiring.trialMessages.list, {
				trialCycleId,
				participantUserId: alice.userId,
			}),
		).rejects.toThrow("your own Thread");
		await expect(
			bob.as.mutation(api.hiring.trialMessages.send, {
				trialCycleId,
				participantUserId: alice.userId,
				body: "Butting in",
			}),
		).rejects.toThrow("your own Thread");

		const alicesView = await alice.as.query(api.hiring.trialMessages.list, {
			trialCycleId,
		});
		expect(bodies(alicesView)).toEqual([
			"Alice's private question",
			"Alice's private answer",
		]);
	});

	test("a Founder reads and replies in a chosen Participant's Thread as themselves", async () => {
		const { setup, alice, bob, trialCycleId } =
			await trialWithTwoParticipants();
		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "Hello from Alice",
		});
		await bob.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "Hello from Bob",
		});

		const alicesThread = await setup.founder.as.query(
			api.hiring.trialMessages.list,
			{ trialCycleId, participantUserId: alice.userId },
		);
		expect(bodies(alicesThread)).toEqual(["Hello from Alice"]);
		await setup.founder.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			participantUserId: alice.userId,
			body: "Hi Alice",
		});

		const afterReply = await alice.as.query(api.hiring.trialMessages.list, {
			trialCycleId,
		});
		expect(afterReply.at(-1)?.user?.username).toBe("founder");
		await expect(
			setup.founder.as.query(api.hiring.trialMessages.list, { trialCycleId }),
		).rejects.toThrow("Choose a Participant");
	});

	test("the Founder Threads list every Participant's Thread with its latest message", async () => {
		const { setup, alice, trialCycleId } = await trialWithTwoParticipants();
		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "First",
		});
		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "Latest from Alice",
		});

		const summaries = await setup.founder.as.query(
			api.hiring.trialMessages.threads,
			{
				trialCycleId,
			},
		);

		expect(summaries.map((thread) => thread.user?.username).sort()).toEqual([
			"alice",
			"bob",
		]);
		const aliceThread = summaries.find(
			(thread) => thread.user?.username === "alice",
		);
		expect(aliceThread?.latest?.body).toBe("Latest from Alice");
		const bobThread = summaries.find(
			(thread) => thread.user?.username === "bob",
		);
		expect(bobThread?.latest).toBeNull();
		await expect(
			alice.as.query(api.hiring.trialMessages.threads, { trialCycleId }),
		).rejects.toThrow("Only founders");
	});

	test("Members who are not Founders, and outsiders, cannot read Threads", async () => {
		const { t, setup, alice, trialCycleId } = await trialWithTwoParticipants();
		const member = await joinAsMember(setup, "Mia");
		const outsider = await signUp(t, "Olly");

		await expect(
			member.as.query(api.hiring.trialMessages.list, {
				trialCycleId,
				participantUserId: alice.userId,
			}),
		).rejects.toThrow("You do not have access");
		await expect(
			outsider.as.query(api.hiring.trialMessages.list, { trialCycleId }),
		).rejects.toThrow("You do not have access");
		await expect(
			outsider.as.mutation(api.hiring.trialMessages.send, {
				trialCycleId,
				body: "Hi",
			}),
		).rejects.toThrow("You do not have access");
	});

	test("an Applicant has no Thread and cannot post", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { admission: "application" });
		const applicant = await signUp(t, "Amy");
		await applicant.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		});

		await expect(
			applicant.as.mutation(api.hiring.trialMessages.send, {
				trialCycleId,
				body: "Pick me",
			}),
		).rejects.toThrow("You do not have access");
		await expect(
			applicant.as.query(api.hiring.trialMessages.list, { trialCycleId }),
		).rejects.toThrow("You do not have access");
		await expect(
			setup.founder.as.mutation(api.hiring.trialMessages.send, {
				trialCycleId,
				participantUserId: applicant.userId,
				body: "Welcome",
			}),
		).rejects.toThrow("not a Participant");
	});

	test("a Thread opens at admission, before the Trial Cycle starts", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);
		const alice = await signUp(t, "Alice");
		await alice.as.mutation(api.hiring.applications.joinTrial, {
			acceptTerms: true,
			trialCycleId,
		});

		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "Excited to start",
		});

		const view = await setup.founder.as.query(api.hiring.trialMessages.list, {
			trialCycleId,
			participantUserId: alice.userId,
		});
		expect(bodies(view)).toEqual(["Excited to start"]);
	});

	test("a Member who is also a Participant keeps their own Thread", async () => {
		const { t, setup, trialCycleId } = await trialWithTwoParticipants();
		const mia = await joinAsMember(setup, "Mia");
		await t.run(async (ctx) => {
			const trial = await ctx.db.get(trialCycleId);
			if (!trial) {
				throw new Error("Trial Cycle not found");
			}
			await ctx.db.insert("applications", {
				userId: mia.userId,
				startupId: setup.startupId,
				roleId: trial.roleId,
				trialCycleId,
				status: "joined",
			});
		});

		await mia.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "Member and Participant",
		});

		const view = await mia.as.query(api.hiring.trialMessages.list, {
			trialCycleId,
		});
		expect(bodies(view)).toEqual(["Member and Participant"]);
	});
});

describe("Announcements", () => {
	test("an Announcement reaches every Participant and only Founders can post one", async () => {
		const { setup, alice, bob, trialCycleId } =
			await trialWithTwoParticipants();
		const member = await joinAsMember(setup, "Mia");

		await setup.founder.as.mutation(api.hiring.trialMessages.announce, {
			trialCycleId,
			body: "Standup moved to 10am",
		});

		for (const participant of [alice, bob]) {
			const view = await participant.as.query(api.hiring.trialMessages.list, {
				trialCycleId,
			});
			expect(bodies(view)).toEqual(["Standup moved to 10am"]);
			expect(await notificationTitles(participant.as)).toContain(
				"New announcement in Build a feature",
			);
		}
		await expect(
			alice.as.mutation(api.hiring.trialMessages.announce, {
				trialCycleId,
				body: "Not allowed",
			}),
		).rejects.toThrow("Only founders");
		await expect(
			member.as.mutation(api.hiring.trialMessages.announce, {
				trialCycleId,
				body: "Not allowed",
			}),
		).rejects.toThrow("Only founders");
	});

	test("Announcements and Thread messages interleave in time order for a Participant", async () => {
		const { setup, alice, trialCycleId } = await trialWithTwoParticipants();
		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "one",
		});
		await setup.founder.as.mutation(api.hiring.trialMessages.announce, {
			trialCycleId,
			body: "two",
		});
		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "three",
		});

		const view = await alice.as.query(api.hiring.trialMessages.list, {
			trialCycleId,
		});

		expect(bodies(view)).toEqual(["one", "two", "three"]);
	});
});

describe("posting", () => {
	test("once a Trial Cycle closes, Threads stay readable but nobody can post", async () => {
		const { t, setup, alice, trialCycleId } = await trialWithTwoParticipants();
		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "Before the end",
		});
		await advancePast(t, 8 * DAY);
		const applications = await t.run(
			async (ctx) => await ctx.db.query("applications").take(10),
		);
		await setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId,
			verdicts: applications.map((application) => ({
				applicationId: application._id,
				verdict: "passed" as const,
			})),
		});

		const view = await alice.as.query(api.hiring.trialMessages.list, {
			trialCycleId,
		});
		expect(bodies(view)).toEqual(["Before the end"]);
		await expect(
			alice.as.mutation(api.hiring.trialMessages.send, {
				trialCycleId,
				body: "Still there?",
			}),
		).rejects.toThrow("closed");
		await expect(
			setup.founder.as.mutation(api.hiring.trialMessages.send, {
				trialCycleId,
				participantUserId: alice.userId,
				body: "Congrats",
			}),
		).rejects.toThrow("closed");
		await expect(
			setup.founder.as.mutation(api.hiring.trialMessages.announce, {
				trialCycleId,
				body: "Goodbye",
			}),
		).rejects.toThrow("closed");
	});

	test("blank messages are rejected", async () => {
		const { alice, trialCycleId } = await trialWithTwoParticipants();

		await expect(
			alice.as.mutation(api.hiring.trialMessages.send, {
				trialCycleId,
				body: "   ",
			}),
		).rejects.toThrow("Message is required");
	});
});

describe("notifications", () => {
	test("messages notify the other side of the Thread", async () => {
		const { setup, alice, trialCycleId } = await trialWithTwoParticipants();

		await alice.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			body: "Question",
		});
		expect(await notificationTitles(setup.founder.as)).toContain(
			"Alice sent a message in Build a feature",
		);

		await setup.founder.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			participantUserId: alice.userId,
			body: "Answer",
		});
		expect(await notificationTitles(alice.as)).toContain(
			"Founder replied in Build a feature",
		);
	});

	test("a Founder's own messages do not notify that Founder", async () => {
		const { setup, alice, trialCycleId } = await trialWithTwoParticipants();
		const before = (await notificationTitles(setup.founder.as)).length;

		await setup.founder.as.mutation(api.hiring.trialMessages.send, {
			trialCycleId,
			participantUserId: alice.userId,
			body: "Answer",
		});
		await setup.founder.as.mutation(api.hiring.trialMessages.announce, {
			trialCycleId,
			body: "News",
		});

		expect((await notificationTitles(setup.founder.as)).length).toBe(before);
	});
});
