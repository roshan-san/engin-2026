import { expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import { createTest, DAY } from "../lib/testing.helpers";
import { type Person, signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";

async function setUpTeam() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const carol = await joinAsMember(setup, "Carol");

	async function createCycle(title: string, members: Person[]) {
		return await setup.founder.as.mutation(api.work.cycles.create, {
			startupId: setup.startupId,
			title,
			startAt: Date.now(),
			endAt: Date.now() + 7 * DAY,
			memberUserIds: members.map((member) => member.userId),
		});
	}

	async function visibleCycles(person: Person) {
		const cycles = await person.as.query(api.work.cycles.list, {
			startupId: setup.startupId,
		});
		return cycles.map((cycle) => cycle.title);
	}

	return { t, setup, bob, carol, createCycle, visibleCycles };
}

test("Members see only the Cycles they are Cycle Members of; Founders see all", async () => {
	const { setup, bob, carol, createCycle, visibleCycles } = await setUpTeam();
	await createCycle("Landing page", [bob]);
	await createCycle("Billing", [carol]);

	expect(await visibleCycles(bob)).toEqual(["Landing page"]);
	expect(await visibleCycles(carol)).toEqual(["Billing"]);
	expect((await visibleCycles(setup.founder)).sort()).toEqual([
		"Billing",
		"Landing page",
	]);
});

test("a Member outside a Cycle cannot open it or touch its Pulses, even by id", async () => {
	const { setup, bob, carol, createCycle } = await setUpTeam();
	const cycleId = await createCycle("Landing page", [bob]);
	const pulseId = await bob.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Hero",
		cycleId,
	});

	await expect(
		carol.as.query(api.work.pulses.listForCycle, { cycleId }),
	).rejects.toThrow("not part of this Cycle");
	await expect(
		carol.as.mutation(api.work.pulses.create, {
			startupId: setup.startupId,
			title: "Sneaky",
			cycleId,
		}),
	).rejects.toThrow("not part of this Cycle");
	await expect(
		carol.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "review",
		}),
	).rejects.toThrow("not part of this Cycle");
	await expect(
		carol.as.mutation(api.work.pulses.assignToMe, { pulseId }),
	).rejects.toThrow("not part of this Cycle");
});

test("a co-founder belongs to every Cycle without being added", async () => {
	const { t, setup, createCycle, visibleCycles } = await setUpTeam();
	await createCycle("Landing page", []);
	const dana = await signUp(t, "Dana");
	await t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: setup.startupId,
			userId: dana.userId,
			role: "founder",
		});
	});

	expect(await visibleCycles(dana)).toEqual(["Landing page"]);
});

test("a Cycle becomes active at its start date", async () => {
	vi.useFakeTimers();
	try {
		const t = createTest();
		const setup = await setUpStartup(t);
		const startAt = Date.now() + DAY;
		const cycleId = await setup.founder.as.mutation(api.work.cycles.create, {
			startupId: setup.startupId,
			title: "Sprint",
			startAt,
			endAt: startAt + 7 * DAY,
		});

		vi.advanceTimersByTime(DAY + 1000);
		await t.finishInProgressScheduledFunctions();

		const cycle = await t.run(async (ctx) => await ctx.db.get(cycleId));
		expect(cycle?.status).toBe("active");
	} finally {
		vi.useRealTimers();
	}
});
