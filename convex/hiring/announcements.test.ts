import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	advancePast,
	type Client,
	createTest,
	DAY,
	HOUR,
} from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import {
	joinAsCoFounder,
	joinAsMember,
	setUpStartup,
} from "../teams/startups.helpers";
import type { Person } from "../people/users.helpers";
import {
	closeWithVerdict,
	createDraftTrial,
	createTrial,
	enterTrial,
	startedTrialWith,
} from "./trialCycles.helpers";

const ANNOUNCED = "New announcement in Build a feature";

/** A running hackathon with Alice alone, ready to close. */
async function trialWithAlice() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(setup, [alice]);
	return { t, setup, alice, trialCycleId };
}

async function trialWithTwoParticipants() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const trialCycleId = await startedTrialWith(setup, [alice, bob]);
	return { t, setup, alice, bob, trialCycleId };
}

/** A hackathon with a pending applicant, Amy, and a participant, Carol, who left once it started. */
async function trialWithApplicantAndLeaver() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const amy = await signUp(t, "Amy");
	await amy.as.mutation(api.hiring.applications.applyToTrial, {
		trialCycleId,
		acceptTerms: true,
	});
	const carol = await signUp(t, "Carol");
	await enterTrial(setup, trialCycleId, carol);
	await advancePast(t, DAY + HOUR);
	await carol.as.mutation(api.hiring.applications.leaveTrial, { trialCycleId });
	return { t, setup, trialCycleId, amy, carol };
}

async function announce(
	as: Client,
	trialCycleId: Id<"trialCycles">,
	body: string,
) {
	await as.mutation(api.hiring.announcements.post, { trialCycleId, body });
}

async function bodiesFor(as: Client, trialCycleId: Id<"trialCycles">) {
	const announcements = await as.query(api.hiring.announcements.list, {
		trialCycleId,
	});
	return announcements.map((announcement) => announcement.body);
}

describe("posting", () => {
	test("a founder's announcement is saved with them as its author", async () => {
		const { setup, alice, trialCycleId } = await trialWithTwoParticipants();

		await announce(setup.founder.as, trialCycleId, "Demo day moved to Friday");

		const [announcement] = await alice.as.query(api.hiring.announcements.list, {
			trialCycleId,
		});
		expect(announcement?.body).toBe("Demo day moved to Friday");
		expect(announcement?.user?.username).toBe("founder");
	});

	test("a member who is not a founder cannot post", async () => {
		const { setup, trialCycleId } = await trialWithTwoParticipants();
		const member = await joinAsMember(setup, "Mia");

		await expect(
			announce(member.as, trialCycleId, "Not allowed"),
		).rejects.toThrow("Only founders can perform this action");
	});

	test("a participant cannot post", async () => {
		const { alice, trialCycleId } = await trialWithTwoParticipants();

		await expect(
			announce(alice.as, trialCycleId, "Not allowed"),
		).rejects.toThrow("You are not a member of this startup");
	});

	test("blank text is refused", async () => {
		const { setup, trialCycleId } = await trialWithTwoParticipants();

		await expect(
			announce(setup.founder.as, trialCycleId, "   "),
		).rejects.toThrow("Announcement is required");
	});

	test("a founder can post before the start", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);

		await announce(setup.founder.as, trialCycleId, "Welcome");

		expect(await bodiesFor(setup.founder.as, trialCycleId)).toEqual([
			"Welcome",
		]);
	});

	test("posting after the close is refused", async () => {
		const { t, setup, alice, trialCycleId } = await trialWithAlice();
		await advancePast(t, 8 * DAY);
		await closeWithVerdict(setup, trialCycleId, alice, "passed");

		await expect(
			announce(setup.founder.as, trialCycleId, "Goodbye"),
		).rejects.toThrow("This Trial Cycle is closed, so it is read-only");
	});

	test("posting after a cancel is refused", async () => {
		const { setup, trialCycleId } = await trialWithTwoParticipants();
		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		await expect(
			announce(setup.founder.as, trialCycleId, "Goodbye"),
		).rejects.toThrow("This Trial Cycle is closed, so it is read-only");
	});
});

describe("notifications", () => {
	test("every joined participant and every co-founder but the author is notified with the trial link", async () => {
		const { setup, alice, bob, trialCycleId } =
			await trialWithTwoParticipants();
		const dana = await joinAsCoFounder(setup, "Dana");
		const before = await notificationTitles(setup.founder.as);

		await announce(setup.founder.as, trialCycleId, "Standup moved");

		for (const person of [alice, bob, dana]) {
			const { notifications } = await person.as.query(
				api.people.notifications.list,
				{},
			);
			const notification = notifications.find(
				(notification) => notification.title === ANNOUNCED,
			);
			expect(notification?.href).toMatch(`/trials/${trialCycleId}`);
			expect(notification?.body).toBe("Standup moved");
		}
		expect(await notificationTitles(setup.founder.as)).toEqual(before);
	});

	test("a participant who left and a pending applicant are not notified", async () => {
		const { setup, trialCycleId, amy, carol } =
			await trialWithApplicantAndLeaver();

		await announce(setup.founder.as, trialCycleId, "Standup moved");

		expect(await notificationTitles(carol.as)).not.toContain(ANNOUNCED);
		expect(await notificationTitles(amy.as)).not.toContain(ANNOUNCED);
	});
});

describe("reading", () => {
	test("participants and members read newest first", async () => {
		const { setup, alice, trialCycleId } = await trialWithTwoParticipants();
		const member = await joinAsMember(setup, "Mia");
		await announce(setup.founder.as, trialCycleId, "first");
		await announce(setup.founder.as, trialCycleId, "second");

		expect(await bodiesFor(alice.as, trialCycleId)).toEqual([
			"second",
			"first",
		]);
		expect(await bodiesFor(member.as, trialCycleId)).toEqual([
			"second",
			"first",
		]);
	});

	test("a completed participant still reads after the close", async () => {
		const { t, setup, alice, trialCycleId } = await trialWithAlice();
		await announce(setup.founder.as, trialCycleId, "Before the end");
		await advancePast(t, 8 * DAY);
		await closeWithVerdict(setup, trialCycleId, alice, "passed");

		expect(await bodiesFor(alice.as, trialCycleId)).toEqual(["Before the end"]);
	});

	test("a pending applicant, a participant who left and an outsider are refused", async () => {
		const { t, trialCycleId, amy, carol } = await trialWithApplicantAndLeaver();
		const outsider = await signUp(t, "Olly");

		for (const person of [amy, carol, outsider]) {
			await expect(bodiesFor(person.as, trialCycleId)).rejects.toThrow(
				"You do not have access to this Trial Cycle",
			);
		}
	});
});

/** A second Startup, "Beta", founded by `founder`, with one open Role. */
async function betaFoundedBy(
	t: ReturnType<typeof createTest>,
	founder: Person,
) {
	const { startupId } = await founder.as.mutation(api.teams.startups.create, {
		name: "Beta",
	});
	const roleId = await founder.as.mutation(api.hiring.roles.create, {
		startupId,
		title: "Designer",
		type: "full-time",
		skills: ["figma"],
		description: "Design things",
		headcount: 1,
	});
	return { t, founder, startupId, roleId };
}

async function threadsOf(as: Client) {
	return await as.query(api.hiring.announcements.listThreads, {});
}

describe("threads", () => {
	test("a participant's and a founder's hackathons are both threads", async () => {
		const { t, alice } = await trialWithAlice();
		const beta = await betaFoundedBy(t, alice);
		await createTrial(beta);

		const threads = await threadsOf(alice.as);

		expect(threads.map((thread) => thread.startupName).sort()).toEqual([
			"Acme",
			"Beta",
		]);
	});

	test("a member sees their startup's hackathons as threads", async () => {
		const { setup } = await trialWithAlice();
		const member = await joinAsMember(setup, "Mia");

		const threads = await threadsOf(member.as);

		expect(threads.map((thread) => thread.startupName)).toEqual(["Acme"]);
	});

	test("pending applicants, leavers and drafts make no thread", async () => {
		const { setup, amy, carol } = await trialWithApplicantAndLeaver();
		await createDraftTrial(setup);

		expect(await threadsOf(amy.as)).toEqual([]);
		expect(await threadsOf(carol.as)).toEqual([]);
		expect(await threadsOf(setup.founder.as)).toHaveLength(1);
	});

	test("a cancelled hackathon with nothing announced makes no thread, one with announcements stays", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const quiet = await createTrial(setup);
		const announced = await createTrial(setup);
		await announce(setup.founder.as, announced, "Heads up");
		for (const trialCycleId of [quiet, announced]) {
			await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
				trialCycleId,
			});
		}

		const threads = await threadsOf(setup.founder.as);

		expect(threads.map((thread) => thread.trialCycleId)).toEqual([announced]);
	});

	test("the thread with the latest announcement comes first, with its count and preview", async () => {
		const { t, setup, alice, trialCycleId } = await trialWithAlice();
		const beta = await betaFoundedBy(t, await signUp(t, "Dana"));
		const betaTrialId = await createTrial(beta, { startsInMs: DAY });
		await enterTrial(beta, betaTrialId, alice);
		await announce(beta.founder.as, betaTrialId, "Welcome to Beta");
		await advancePast(t, HOUR);
		await announce(setup.founder.as, trialCycleId, "Old news");
		await announce(setup.founder.as, trialCycleId, "Demo on Friday");

		const threads = await threadsOf(alice.as);

		expect(
			threads.map((thread) => [
				thread.startupName,
				thread.announcementCount,
				thread.latest?.body,
			]),
		).toEqual([
			["Acme", 2, "Demo on Friday"],
			["Beta", 1, "Welcome to Beta"],
		]);
	});

	test("opening a thread shows its announcements newest first with the Trial Cycle link", async () => {
		const { t, setup, alice, trialCycleId } = await trialWithAlice();
		await announce(setup.founder.as, trialCycleId, "first");
		await announce(setup.founder.as, trialCycleId, "second");
		const startup = await t.run(
			async (ctx) => await ctx.db.get(setup.startupId),
		);

		const thread = await alice.as.query(api.hiring.announcements.getThread, {
			trialCycleId,
		});

		expect(thread.startupName).toBe("Acme");
		expect(thread.href).toBe(`/s/${startup?.slug}/trials/${trialCycleId}`);
		expect(thread.announcements.map((a) => a.body)).toEqual([
			"second",
			"first",
		]);
	});

	test("an outsider cannot open a thread", async () => {
		const { t, trialCycleId } = await trialWithAlice();
		const outsider = await signUp(t, "Olly");

		const attempt = outsider.as.query(api.hiring.announcements.getThread, {
			trialCycleId,
		});

		await expect(attempt).rejects.toThrow(
			"You do not have access to this Trial Cycle",
		);
	});
});
