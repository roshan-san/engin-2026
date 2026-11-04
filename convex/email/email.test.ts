import { describe, expect, it } from "vitest";
import { internal } from "../_generated/api";
import { createTest } from "../testing/test.setup";
import { sendEmail } from "./model";
import { sendingSettings } from "./rules";

const EMAIL = {
	to: "ana@example.com",
	kind: "accepted" as const,
	subject: "You're in",
	text: "See you Monday.",
};

describe("email", () => {
	it("an email is logged with an unsubscribe link", async () => {
		const t = createTest();

		const result = await t.run(async (ctx) => {
			const sent = await sendEmail(ctx, EMAIL);
			const logged = await ctx.db.query("emails").collect();
			const prefs = await ctx.db.query("emailPrefs").collect();
			return { sent, logged, prefs };
		});

		expect(result.sent).toBe("sent");
		expect(result.logged).toMatchObject([
			{ to: "ana@example.com", kind: "accepted", subject: "You're in" },
		]);
		expect(result.logged[0].text).toContain(
			`/email/unsubscribe?token=${result.prefs[0].token}`,
		);
	});

	it("an opted-out address gets nothing", async () => {
		const t = createTest();
		await t.run(async (ctx) => {
			await ctx.db.insert("emailPrefs", {
				email: "ana@example.com",
				token: "tok",
				optedOut: true,
			});
		});

		const sent = await t.run(async (ctx) => await sendEmail(ctx, EMAIL));

		expect(sent).toBe("skipped");
		const logged = await t.run(
			async (ctx) => await ctx.db.query("emails").collect(),
		);
		expect(logged).toEqual([]);
	});

	it("the same dedupeKey sends once", async () => {
		const t = createTest();

		const results = await t.run(async (ctx) => [
			await sendEmail(ctx, { ...EMAIL, dedupeKey: "start:h1:ana" }),
			await sendEmail(ctx, { ...EMAIL, dedupeKey: "start:h1:ana" }),
		]);

		expect(results).toEqual(["sent", "skipped"]);
	});

	it("addresses are matched without case or spaces", async () => {
		const t = createTest();

		await t.run(async (ctx) => {
			await sendEmail(ctx, EMAIL);
			await sendEmail(ctx, { ...EMAIL, to: " Ana@Example.com " });
		});

		const prefs = await t.run(
			async (ctx) => await ctx.db.query("emailPrefs").collect(),
		);
		expect(prefs).toHaveLength(1);
	});

	it("unsubscribe with the token opts out", async () => {
		const t = createTest();
		const token = await t.run(async (ctx) => {
			await sendEmail(ctx, EMAIL);
			const [prefs] = await ctx.db.query("emailPrefs").collect();
			return prefs.token;
		});

		const done = await t.mutation(internal.email.unsubscribe, { token });
		const again = await t.run(async (ctx) => await sendEmail(ctx, EMAIL));

		expect(done).toBe(true);
		expect(again).toBe("skipped");
	});

	it("unsubscribe with a bad token changes nothing", async () => {
		const t = createTest();
		await t.run(async (ctx) => await sendEmail(ctx, EMAIL));

		const done = await t.mutation(internal.email.unsubscribe, {
			token: "nope",
		});

		expect(done).toBe(false);
		const [prefs] = await t.run(
			async (ctx) => await ctx.db.query("emailPrefs").collect(),
		);
		expect(prefs.optedOut).toBe(false);
	});
});

describe("unsubscribe link", () => {
	async function tokenOf(t: ReturnType<typeof createTest>) {
		return await t.run(async (ctx) => {
			await sendEmail(ctx, EMAIL);
			const [prefs] = await ctx.db.query("emailPrefs").collect();
			return prefs.token;
		});
	}
	const optedOut = async (t: ReturnType<typeof createTest>) =>
		(await t.run(async (ctx) => await ctx.db.query("emailPrefs").collect()))[0]
			.optedOut;

	it("opening the link only asks, so mail scanners can't unsubscribe anyone", async () => {
		const t = createTest();
		const token = await tokenOf(t);

		const page = await t.fetch(`/email/unsubscribe?token=${token}`, {
			method: "GET",
		});

		expect(page.status).toBe(200);
		expect(await page.text()).toContain('method="post"');
		expect(await optedOut(t)).toBe(false);
	});

	it("posting the link unsubscribes", async () => {
		const t = createTest();
		const token = await tokenOf(t);

		const done = await t.fetch(`/email/unsubscribe?token=${token}`, {
			method: "POST",
		});

		expect(done.status).toBe(200);
		expect(await optedOut(t)).toBe(true);
	});
});

describe("sending settings", () => {
	it("needs a key and a from address; replies go to EMAIL_REPLY_TO, else the from address", () => {
		expect(sendingSettings({ EMAIL_FROM: "engin <hi@acme.in>" })).toBeNull();
		expect(
			sendingSettings({
				RESEND_API_KEY: "re_1",
				EMAIL_FROM: "engin <hi@acme.in>",
			}),
		).toEqual({
			from: "engin <hi@acme.in>",
			replyTo: ["engin <hi@acme.in>"],
			testMode: true,
		});
		expect(
			sendingSettings({
				RESEND_API_KEY: "re_1",
				EMAIL_FROM: "engin <noreply@acme.in>",
				EMAIL_REPLY_TO: "founders@acme.in",
				EMAIL_TEST_MODE: "false",
			}),
		).toEqual({
			from: "engin <noreply@acme.in>",
			replyTo: ["founders@acme.in"],
			testMode: false,
		});
	});
});
