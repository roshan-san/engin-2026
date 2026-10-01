import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import {
	balanceOf,
	createDraftTrial,
	createTest,
	createTrial,
	DAY,
	giveCredit,
	HOUR,
	setUpStartup,
	signUp,
} from "../test.helpers";

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

async function applyWith(
	t: Parameters<typeof signUp>[0],
	trialCycleId: Awaited<ReturnType<typeof createTrial>>,
	names: string[],
) {
	for (const name of names) {
		const person = await signUp(t, name);
		await person.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		});
	}
}

test("a hackathon with fewer than 3 applications earns its founder a re-run credit for 60 days", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, {
		admission: "application",
		startsInMs: DAY,
	});
	await applyWith(t, trialCycleId, ["Alice", "Bob"]);
	vi.advanceTimersByTime(DAY + HOUR);

	await t.mutation(internal.billing.credits.grantRerunCredit, {
		trialCycleId,
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
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("Entry is still open");
});

test("3 applications earn no re-run credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, {
		admission: "application",
		startsInMs: DAY,
	});
	await applyWith(t, trialCycleId, ["Alice", "Bob", "Cara"]);
	vi.advanceTimersByTime(DAY + HOUR);

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("3 or more applications");
});

test("a hackathon earns at most one re-run credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	vi.advanceTimersByTime(DAY + HOUR);
	await t.mutation(internal.billing.credits.grantRerunCredit, {
		trialCycleId,
	});

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("already got a re-run credit");
	expect(await balanceOf(setup.founder.as)).toBe(1);
});

test("a re-run can't earn another re-run credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
	await giveCredit(t, setup.founder.userId, { source: "rerun" });
	await setup.founder.as.mutation(api.hiring.trialCycles.publish, {
		trialCycleId,
		acceptTerms: true,
	});
	vi.advanceTimersByTime(DAY + HOUR);

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("can't earn another");
});

test("a draft or an ungated hackathon earns no re-run credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
	vi.advanceTimersByTime(DAY + HOUR);

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("published through the paid gate");
});
