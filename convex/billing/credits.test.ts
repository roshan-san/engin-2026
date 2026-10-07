import { describe, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	createDraftHackathon,
	createHackathon,
	startedHackathonWith,
} from "../hiring/hackathons.helpers";
import { createTest, DAY, HOUR, type TestConvex } from "../lib/testing.helpers";
import { signUp, signUpNew } from "../people/users.helpers";
import { onUserSignedIn } from "../people/users.rules";
import { proMonthOf } from "./credits.rules";
import { type Setup, setUpStartup } from "../teams/startups.helpers";
import { balanceOf, giveCredit } from "./credits.helpers";

async function applyWith(
	t: TestConvex,
	hackathonId: Id<"hackathons">,
	names: string[],
) {
	for (const name of names) {
		const person = await signUp(t, name);
		await person.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});
	}
}

describe("signup credit", () => {
	test("a new account starts with one credit that never expires", async () => {
		const t = createTest();

		const founder = await signUpNew(t, "Founder");

		const { available, credits } = await founder.as.query(
			api.billing.credits.balance,
			{},
		);
		expect(available).toBe(1);
		expect(credits).toEqual([
			expect.objectContaining({ source: "signup", expiresAt: null }),
		]);
	});

	test("signing in again to an existing account grants nothing", async () => {
		const t = createTest();
		const founder = await signUpNew(t, "Founder");

		await t.run(
			async (ctx) =>
				await onUserSignedIn(ctx, {
					userId: founder.userId,
					existingUserId: founder.userId,
				}),
		);

		expect(await balanceOf(founder.as)).toBe(1);
	});

	test("the signup grant gives each user one credit, however often it runs", async () => {
		const t = createTest();
		const founder = await signUpNew(t, "Founder");

		await t.run(
			async (ctx) =>
				await onUserSignedIn(ctx, {
					userId: founder.userId,
					existingUserId: null,
				}),
		);

		expect(await balanceOf(founder.as)).toBe(1);
	});
});

describe("re-run credits", () => {
	test("a hackathon with fewer than 3 applications earns its founder a re-run credit for 60 days", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		await applyWith(t, hackathonId, ["Alice", "Bob"]);
		vi.advanceTimersByTime(DAY + HOUR);

		await t.mutation(internal.billing.credits.grantRerunCredit, {
			hackathonId,
		});

		const { credits } = await setup.founder.as.query(
			api.billing.credits.balance,
			{},
		);
		expect(credits.map((credit) => credit.source)).toEqual(["rerun"]);
		vi.advanceTimersByTime(61 * DAY);
		expect(await balanceOf(setup.founder.as)).toBe(0);
	});

	test("a re-run credit waits until entry closes", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });

		await expect(
			t.mutation(internal.billing.credits.grantRerunCredit, { hackathonId }),
		).rejects.toThrow("Entry is still open");
	});

	test("3 applications earn no re-run credit", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		await applyWith(t, hackathonId, ["Alice", "Bob", "Cara"]);
		vi.advanceTimersByTime(DAY + HOUR);

		await expect(
			t.mutation(internal.billing.credits.grantRerunCredit, { hackathonId }),
		).rejects.toThrow("3 or more applications");
	});

	test("a hackathon earns at most one re-run credit", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		vi.advanceTimersByTime(DAY + HOUR);
		await t.mutation(internal.billing.credits.grantRerunCredit, {
			hackathonId,
		});

		await expect(
			t.mutation(internal.billing.credits.grantRerunCredit, { hackathonId }),
		).rejects.toThrow("already got a re-run credit");
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("a re-run can't earn another re-run credit", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, { startsInMs: DAY });
		await giveCredit(t, setup.founder.userId, { source: "rerun" });
		await setup.founder.as.mutation(api.hiring.hackathons.publish, {
			hackathonId,
			acceptTerms: true,
		});
		vi.advanceTimersByTime(DAY + HOUR);

		await expect(
			t.mutation(internal.billing.credits.grantRerunCredit, { hackathonId }),
		).rejects.toThrow("can't earn another");
	});

	test("a draft or an ungated hackathon earns no re-run credit", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, { startsInMs: DAY });
		vi.advanceTimersByTime(DAY + HOUR);

		await expect(
			t.mutation(internal.billing.credits.grantRerunCredit, { hackathonId }),
		).rejects.toThrow("published through the paid gate");
	});
});

describe("cancel refund", () => {
	async function cancel(setup: Setup, hackathonId: Id<"hackathons">) {
		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});
	}

	test("cancelling an open hackathon returns the exact credit that paid for it", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const creditId = await giveCredit(t, setup.founder.userId, {
			source: "signup",
		});
		// createHackathon adds a purchase credit, but the signup credit is spent first.
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });

		await cancel(setup, hackathonId);

		const { credits } = await setup.founder.as.query(
			api.billing.credits.balance,
			{},
		);
		expect(credits.map((credit) => credit._id)).toContain(creditId);
		expect(credits).toHaveLength(2);
	});

	test("a co-founder's cancel returns the credit to the founder who published", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const cofounder = await signUp(t, "Cody");
		await t.run(async (ctx) => {
			await ctx.db.insert("memberships", {
				startupId: setup.startupId,
				userId: cofounder.userId,
				role: "founder",
			});
		});
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });

		await cofounder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		expect(await balanceOf(setup.founder.as)).toBe(1);
		expect(await balanceOf(cofounder.as)).toBe(0);
	});

	test("cancelling a running hackathon returns nothing", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);

		await cancel(setup, hackathonId);

		expect(await balanceOf(setup.founder.as)).toBe(0);
	});

	test("cancelling an unpublished hackathon leaves the balance alone", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		await giveCredit(t, setup.founder.userId);
		const hackathonId = await createDraftHackathon(setup);

		await cancel(setup, hackathonId);

		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("a refunded re-run credit keeps its original expiry", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const expiresAt = Date.now() + 10 * DAY;
		await giveCredit(t, setup.founder.userId, { source: "rerun", expiresAt });
		const hackathonId = await createDraftHackathon(setup, { startsInMs: DAY });
		await setup.founder.as.mutation(api.hiring.hackathons.publish, {
			hackathonId,
			acceptTerms: true,
		});

		await cancel(setup, hackathonId);

		const { credits } = await setup.founder.as.query(
			api.billing.credits.balance,
			{},
		);
		expect(credits).toEqual([
			expect.objectContaining({ source: "rerun", expiresAt }),
		]);
	});
});

describe("Pro months", () => {
	test("a Pro month that starts on the 31st ends on the last day of a shorter month", () => {
		const startedAt = Date.parse("2027-01-31T09:00:00Z");

		const first = proMonthOf(startedAt, Date.parse("2027-02-10T00:00:00Z"));
		const second = proMonthOf(startedAt, Date.parse("2027-03-01T00:00:00Z"));

		expect(first).toEqual({
			month: 0,
			endsAt: Date.parse("2027-02-28T09:00:00Z"),
		});
		expect(second).toEqual({
			month: 1,
			endsAt: Date.parse("2027-03-31T09:00:00Z"),
		});
	});
});
