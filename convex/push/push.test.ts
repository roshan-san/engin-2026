import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { participants } from "../applications/applications.setup";
import { emailUser, sendEmail } from "../email/model";
import { publishedHackathon } from "../hackathons/hackathons.setup";
import { type Setup, setUpStartup } from "../startups/startups.setup";
import { createTest } from "../testing/test.setup";
import { signUp } from "../users/users.setup";
import { pushPayload } from "./rules";

const SUBSCRIPTION = {
	endpoint: "https://push.example.com/abc",
	keys: { p256dh: "p256", auth: "auth" },
};

async function pushesFor(setup: Setup, userId: Id<"users">) {
	return await setup.t.run(async (ctx) =>
		(await ctx.db.system.query("_scheduled_functions").collect()).filter(
			(job) =>
				job.name.startsWith("push/send") &&
				(job.args[0] as { userId: string }).userId === userId,
		),
	);
}

describe("push subscriptions", () => {
	it("subscribing stores the device once, and unsubscribing removes it", async () => {
		const setup = await setUpStartup(createTest());

		await setup.founder.as.mutation(api.push.subscribe, SUBSCRIPTION);
		await setup.founder.as.mutation(api.push.subscribe, SUBSCRIPTION);
		const stored = await setup.t.run(
			async (ctx) => await ctx.db.query("pushSubscriptions").collect(),
		);
		expect(stored).toMatchObject([
			{ userId: setup.founder.userId, endpoint: SUBSCRIPTION.endpoint },
		]);

		await setup.founder.as.mutation(api.push.unsubscribe, {
			endpoint: SUBSCRIPTION.endpoint,
		});
		const after = await setup.t.run(
			async (ctx) => await ctx.db.query("pushSubscriptions").collect(),
		);
		expect(after).toEqual([]);
	});

	it("a device signed in as someone else moves to them", async () => {
		const setup = await setUpStartup(createTest());
		const ana = await signUp(setup.t, "Ana");
		await setup.founder.as.mutation(api.push.subscribe, SUBSCRIPTION);

		await ana.as.mutation(api.push.subscribe, SUBSCRIPTION);

		const stored = await setup.t.run(
			async (ctx) => await ctx.db.query("pushSubscriptions").collect(),
		);
		expect(stored).toMatchObject([{ userId: ana.userId }]);
	});

	it("someone else can't remove your device", async () => {
		const setup = await setUpStartup(createTest());
		const ana = await signUp(setup.t, "Ana");
		await setup.founder.as.mutation(api.push.subscribe, SUBSCRIPTION);

		await ana.as.mutation(api.push.unsubscribe, {
			endpoint: SUBSCRIPTION.endpoint,
		});

		const stored = await setup.t.run(
			async (ctx) => await ctx.db.query("pushSubscriptions").collect(),
		);
		expect(stored).toHaveLength(1);
	});
});

describe("push alongside email", () => {
	it("an email to a user with a device also pushes to them", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await signUp(setup.t, "Ana");
		await ana.as.mutation(api.push.subscribe, SUBSCRIPTION);
		const applicationId = await ana.as.mutation(api.applications.apply, {
			hackathonId,
			answer: "I fix signups.",
		});

		await setup.founder.as.mutation(api.applications.accept, { applicationId });

		const [push] = await pushesFor(setup, ana.userId);
		expect(push.args[0]).toMatchObject({
			title: "You're in: Frontend at Acme",
			url: `http://localhost:3000/hackathons/${hackathonId}`,
		});
	});

	it("no device, no push", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);

		expect(await pushesFor(setup, ana.userId)).toEqual([]);
	});

	it("opting out of email doesn't stop push, but a repeat timed message pushes once", async () => {
		const setup = await setUpStartup(createTest());
		await setup.founder.as.mutation(api.push.subscribe, SUBSCRIPTION);
		await setup.t.run(async (ctx) => {
			await ctx.db.insert("emailPrefs", {
				email: "fay@example.com",
				token: "t",
				optedOut: true,
			});
			const email = {
				kind: "monday_reminder" as const,
				subject: "Start the week at Acme",
				text: "Press Start the week.\n\nhttp://localhost:3000/s/acme/cycle",
				dedupeKey: "monday:x",
			};
			await emailUser(ctx, setup.founder.userId, email);
			await emailUser(ctx, setup.founder.userId, email);
		});

		expect(await pushesFor(setup, setup.founder.userId)).toHaveLength(1);
	});

	it("an email to an address only (an invite) doesn't push", async () => {
		const setup = await setUpStartup(createTest());
		await setup.founder.as.mutation(api.push.subscribe, SUBSCRIPTION);

		await setup.t.run(async (ctx) => {
			await sendEmail(ctx, {
				to: "fay@example.com",
				kind: "team_invite",
				subject: "Join",
				text: "Hi",
			});
		});

		expect(await pushesFor(setup, setup.founder.userId)).toEqual([]);
	});
});

describe("pushPayload", () => {
	it("titles with the subject, the first paragraph as body, and the last link to open", () => {
		expect(
			pushPayload({
				subject: "Offer from Acme",
				text: "Acme has made you an Offer:\n\nPaid internship\n\nAccept: https://app/h/1",
			}),
		).toEqual({
			title: "Offer from Acme",
			body: "Acme has made you an Offer:",
			url: "https://app/h/1",
		});
	});

	it("long bodies are cut, and no link opens the app", () => {
		const payload = pushPayload({ subject: "S", text: "x".repeat(300) });
		expect(payload.body).toHaveLength(140);
		expect(payload.body.endsWith("…")).toBe(true);
		expect(payload.url).toBe("http://localhost:3000/home");
	});
});
