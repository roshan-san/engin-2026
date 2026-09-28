import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { TestConvex } from "./test.helpers";
import {
	applicationIdOf,
	createTest,
	createTrial,
	setUpStartup,
	signUp,
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
