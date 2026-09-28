import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { TestConvex } from "./test.helpers";
import {
	applicationIdOf,
	closeWithVerdict,
	createTest,
	createTrial,
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

async function notificationsFor(as: Awaited<ReturnType<typeof signUp>>["as"]) {
	const { notifications } = await as.query(api.notifications.list, {});
	return notifications;
}

function hrefOf(
	notifications: Awaited<ReturnType<typeof notificationsFor>>,
	title: string,
) {
	return notifications.find((notification) => notification.title === title)
		?.href;
}

async function slugOf(t: TestConvex, startupId: Id<"startups">) {
	const startup = await t.run(async (ctx) => await ctx.db.get(startupId));
	return startup?.slug;
}

test("a Participant joining an open Trial Cycle notifies the Founder with a slug-carrying link", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const alice = await signUp(t, "Alice");
	const slug = await slugOf(t, setup.startupId);

	await alice.as.mutation(api.hiring.applications.joinTrial, { trialCycleId });

	const notifications = await notificationsFor(setup.founder.as);
	expect(hrefOf(notifications, "Someone joined Build a feature")).toBe(
		`/s/${slug}/trials/${trialCycleId}`,
	);
});

test("applying to an application-admission Trial Cycle notifies the Founder with a slug-carrying link", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { admission: "application" });
	const alice = await signUp(t, "Alice");
	const slug = await slugOf(t, setup.startupId);

	await alice.as.mutation(api.hiring.applications.applyToTrial, {
		trialCycleId,
	});

	const notifications = await notificationsFor(setup.founder.as);
	expect(hrefOf(notifications, "New application for Build a feature")).toBe(
		`/s/${slug}/trials/${trialCycleId}`,
	);
});

test("rejecting an application notifies the Applicant with a slug-carrying link", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { admission: "application" });
	const bob = await signUp(t, "Bob");
	const slug = await slugOf(t, setup.startupId);
	await bob.as.mutation(api.hiring.applications.applyToTrial, {
		trialCycleId,
	});
	const applicationId = await applicationIdOf(t, trialCycleId, bob.userId);

	await setup.founder.as.mutation(api.hiring.applications.decide, {
		applicationId,
		status: "rejected",
	});

	const notifications = await notificationsFor(bob.as);
	expect(
		hrefOf(
			notifications,
			"Your application to Build a feature was not accepted",
		),
	).toBe(`/s/${slug}/trials/${trialCycleId}`);
});

test("a Trial Cycle starting notifies its Participant with a slug-carrying link", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const slug = await slugOf(t, setup.startupId);

	const trialCycleId = await startedTrialWith(t, setup, [alice]);

	const notifications = await notificationsFor(alice.as);
	expect(hrefOf(notifications, "Build a feature has started")).toBe(
		`/s/${slug}/trials/${trialCycleId}`,
	);
});

test("a passed Verdict notifies the Participant with a slug-carrying link", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const slug = await slugOf(t, setup.startupId);
	const trialCycleId = await startedTrialWith(t, setup, [alice]);

	await closeWithVerdict(t, setup, trialCycleId, alice, "passed");

	const notifications = await notificationsFor(alice.as);
	expect(
		hrefOf(notifications, "Your Verdict for Build a feature is in"),
	).toBe(`/s/${slug}/trials/${trialCycleId}`);
});

test("a Thread message and its Announcement counterpart carry a slug-carrying link", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const slug = await slugOf(t, setup.startupId);
	const trialCycleId = await startedTrialWith(t, setup, [alice]);

	await alice.as.mutation(api.hiring.trialMessages.send, {
		trialCycleId,
		body: "Question",
	});
	const founderNotifications = await notificationsFor(setup.founder.as);
	expect(
		hrefOf(founderNotifications, "Alice sent a message in Build a feature"),
	).toBe(`/s/${slug}/trials/${trialCycleId}`);

	await setup.founder.as.mutation(api.hiring.trialMessages.announce, {
		trialCycleId,
		body: "Standup moved",
	});
	const aliceNotifications = await notificationsFor(alice.as);
	expect(
		hrefOf(aliceNotifications, "New announcement in Build a feature"),
	).toBe(`/s/${slug}/trials/${trialCycleId}`);
});
