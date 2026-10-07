import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	applicationIdOf,
	closeWithVerdict,
	createHackathon,
	startedHackathonWith,
} from "../hiring/hackathons.helpers";
import {
	type Client,
	createTest,
	type TestConvex,
} from "../lib/testing.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { cycleTaskFor, submitWithProof } from "../work/cycles.helpers";
import { signUp } from "./users.helpers";

async function notificationsFor(as: Client) {
	const { notifications } = await as.query(api.people.notifications.list, {});
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

describe("hiring", () => {
	test("applying to a Hackathon notifies the Founder with a slug-carrying link", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");
		const slug = await slugOf(t, setup.startupId);

		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});

		const notifications = await notificationsFor(setup.founder.as);
		expect(hrefOf(notifications, "New application for Build a feature")).toBe(
			`/s/${slug}/hackathons/${hackathonId}`,
		);
	});

	test("rejecting an application notifies the Applicant with a slug-carrying link", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const bob = await signUp(t, "Bob");
		const slug = await slugOf(t, setup.startupId);
		await bob.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});
		const applicationId = await applicationIdOf(t, hackathonId, bob.userId);

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
		).toBe(`/s/${slug}/hackathons/${hackathonId}`);
	});

	test("a Hackathon starting notifies its Participant with a slug-carrying link", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const slug = await slugOf(t, setup.startupId);

		const hackathonId = await startedHackathonWith(setup, [alice]);

		const notifications = await notificationsFor(alice.as);
		expect(hrefOf(notifications, "Build a feature has started")).toBe(
			`/s/${slug}/hackathons/${hackathonId}`,
		);
	});

	test("a passed Verdict notifies the Participant with a slug-carrying link", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const slug = await slugOf(t, setup.startupId);
		const hackathonId = await startedHackathonWith(setup, [alice]);

		await closeWithVerdict(setup, hackathonId, alice, "passed");

		const notifications = await notificationsFor(alice.as);
		expect(
			hrefOf(notifications, "Your Verdict for Build a feature is in"),
		).toBe(`/s/${slug}/hackathons/${hackathonId}`);
	});

	test("an Announcement notifies Participants with a slug-carrying link", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const slug = await slugOf(t, setup.startupId);
		const hackathonId = await startedHackathonWith(setup, [alice]);

		await setup.founder.as.mutation(api.hiring.announcements.post, {
			hackathonId,
			body: "Standup moved",
		});

		const notifications = await notificationsFor(alice.as);
		const announcement = notifications.find(
			(notification) =>
				notification.title === "New announcement in Build a feature",
		);
		expect(announcement?.kind).toBe("announcement");
		expect(announcement?.href).toBe(`/s/${slug}/hackathons/${hackathonId}`);
	});

	test("withdrawing an Offer notifies the Participant with a link to the Hackathon", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const slug = await slugOf(t, setup.startupId);
		const hackathonId = await startedHackathonWith(setup, [alice]);
		await closeWithVerdict(setup, hackathonId, alice, "passed_with_offer");
		const [offer] = await alice.as.query(api.hiring.offers.listMine, {});

		await setup.founder.as.mutation(api.hiring.offers.withdraw, {
			offerId: offer?._id ?? ("" as never),
		});

		const notifications = await notificationsFor(alice.as);
		expect(hrefOf(notifications, "Your Offer from Acme was withdrawn")).toBe(
			`/s/${slug}/hackathons/${hackathonId}`,
		);
	});

	test("accepting an Offer notifies the Founder with a link to the Hackathon", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const slug = await slugOf(t, setup.startupId);
		const hackathonId = await startedHackathonWith(setup, [alice]);
		await closeWithVerdict(setup, hackathonId, alice, "passed_with_offer");
		const [offer] = await alice.as.query(api.hiring.offers.listMine, {});

		await alice.as.mutation(api.hiring.offers.accept, {
			offerId: offer?._id ?? ("" as never),
		});

		const notifications = await notificationsFor(setup.founder.as);
		expect(hrefOf(notifications, "Alice accepted your Offer")).toBe(
			`/s/${slug}/hackathons/${hackathonId}`,
		);
	});

	test("across a full hiring loop, no notification links to the old /app prefix", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		await closeWithVerdict(setup, hackathonId, alice, "passed_with_offer");
		const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
		await alice.as.mutation(api.hiring.offers.accept, {
			offerId: offer?._id ?? ("" as never),
		});

		const founderNotifications = await notificationsFor(setup.founder.as);
		const aliceNotifications = await notificationsFor(alice.as);
		for (const notifications of [founderNotifications, aliceNotifications]) {
			expect(
				notifications.every(
					(notification) => !notification.href?.startsWith("/app"),
				),
			).toBe(true);
		}
	});
});

describe("work", () => {
	test("being added to a Cycle notifies the Member with a slug-carrying link", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const bob = await joinAsMember(setup, "Bob");
		const slug = await slugOf(t, setup.startupId);

		const { cycleId } = await cycleTaskFor(setup, bob);

		const notifications = await notificationsFor(bob.as);
		expect(
			hrefOf(notifications, "You were added to the Cycle Landing page"),
		).toBe(`/s/${slug}/cycles/${cycleId}`);
	});

	test("a Cycle Task moving to review, then verified, carries the Cycle's slug-carrying link", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const bob = await joinAsMember(setup, "Bob");
		const slug = await slugOf(t, setup.startupId);
		const { cycleId, taskId } = await cycleTaskFor(setup, bob);

		await submitWithProof(bob, taskId);
		const founderNotifications = await notificationsFor(setup.founder.as);
		expect(
			hrefOf(founderNotifications, "Hero section is ready for review"),
		).toBe(`/s/${slug}/cycles/${cycleId}`);

		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });
		const bobNotifications = await notificationsFor(bob.as);
		expect(hrefOf(bobNotifications, "Hero section was verified")).toBe(
			`/s/${slug}/cycles/${cycleId}`,
		);
	});
});

async function seedNotifications(
	t: TestConvex,
	userId: Id<"users">,
	count: number,
) {
	await t.run(async (ctx) => {
		for (let index = 0; index < count; index++) {
			await ctx.db.insert("notifications", {
				userId,
				kind: "team",
				title: `Notice ${index}`,
			});
		}
	});
}

describe("inbox", () => {
	test("the unread count covers unread notifications beyond the listed ones", async () => {
		const t = createTest();
		const alice = await signUp(t, "Alice");
		await seedNotifications(t, alice.userId, 35);

		const feed = await alice.as.query(api.people.notifications.list, {});

		expect(feed.notifications).toHaveLength(30);
		expect(feed.unreadCount).toBe(35);
	});

	test("marking one notification read lowers the unread count", async () => {
		const t = createTest();
		const alice = await signUp(t, "Alice");
		await seedNotifications(t, alice.userId, 2);
		const [first] = await notificationsFor(alice.as);

		await alice.as.mutation(api.people.notifications.markRead, {
			notificationId: first._id,
		});

		const feed = await alice.as.query(api.people.notifications.list, {});
		expect(feed.unreadCount).toBe(1);
		expect(feed.notifications[0].isRead).toBe(true);
	});

	test("mark all read clears every unread notification", async () => {
		const t = createTest();
		const alice = await signUp(t, "Alice");
		await seedNotifications(t, alice.userId, 40);

		await alice.as.mutation(api.people.notifications.markAllRead, {});

		const feed = await alice.as.query(api.people.notifications.list, {});
		expect(feed.unreadCount).toBe(0);
		expect(feed.notifications.every((n) => n.isRead)).toBe(true);
	});

	test("mark all read leaves other people's notifications alone", async () => {
		const t = createTest();
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		await seedNotifications(t, alice.userId, 2);
		await seedNotifications(t, bob.userId, 3);

		await alice.as.mutation(api.people.notifications.markAllRead, {});

		const feed = await bob.as.query(api.people.notifications.list, {});
		expect(feed.unreadCount).toBe(3);
	});

	test("nobody can mark someone else's notification read", async () => {
		const t = createTest();
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		await seedNotifications(t, alice.userId, 1);
		const [notification] = await notificationsFor(alice.as);

		const attempt = bob.as.mutation(api.people.notifications.markRead, {
			notificationId: notification._id,
		});

		await expect(attempt).rejects.toThrow("Notification not found");
	});
});
