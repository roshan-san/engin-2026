import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { balanceOf, createTest, DAY, signUp } from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("a launch code gives the founder who claims it one credit", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");
	const code = await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "launch",
		issuedTo: "E-cell session",
	});

	await founder.as.mutation(api.billing.credits.claimLaunchCode, { code });

	const balance = await founder.as.query(api.billing.credits.balance, {});
	expect(balance.available).toBe(1);
	expect(balance.credits[0]?.source).toBe("launch");
});

test("a launch code claims whatever its case, spaces or dashes", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");
	const code = await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "launch",
		issuedTo: "E-cell session",
	});
	const typed = ` ${code.slice(0, 4).toLowerCase()}-${code.slice(4)} `;

	await founder.as.mutation(api.billing.credits.claimLaunchCode, {
		code: typed,
	});

	expect(await balanceOf(founder.as)).toBe(1);
});

test("a launch code can be claimed once", async () => {
	const t = createTest();
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const code = await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "launch",
		issuedTo: "E-cell session",
	});
	await alice.as.mutation(api.billing.credits.claimLaunchCode, { code });

	await expect(
		bob.as.mutation(api.billing.credits.claimLaunchCode, { code }),
	).rejects.toThrow("already been used");
	expect(await balanceOf(bob.as)).toBe(0);
});

test("an unknown code is rejected", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");

	await expect(
		founder.as.mutation(api.billing.credits.claimLaunchCode, {
			code: "NOPE-NOPE-NOPE",
		}),
	).rejects.toThrow("doesn't exist");
});

test("Engin can create 10 launch codes per 90 days, and UPI codes don't count", async () => {
	const t = createTest();
	for (let index = 0; index < 10; index += 1) {
		await t.mutation(internal.billing.credits.createLaunchCode, {
			source: "launch",
			issuedTo: `Session ${index}`,
		});
	}

	await expect(
		t.mutation(internal.billing.credits.createLaunchCode, {
			source: "launch",
			issuedTo: "One too many",
		}),
	).rejects.toThrow("10 codes per 90 days");
	await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "upi",
		issuedTo: "Paid by UPI",
	});

	vi.advanceTimersByTime(91 * DAY);
	await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "launch",
		issuedTo: "Next quarter",
	});
});
