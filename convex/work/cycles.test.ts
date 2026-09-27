import { expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	createTest,
	cyclePulseFor,
	DAY,
	joinAsMember,
	notificationTitles,
	setUpStartup,
	signUp,
} from "../test.helpers";

type Person = Awaited<ReturnType<typeof signUp>>;

async function setUpTeam() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");
	const carol = await joinAsMember(t, setup, "Carol");

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
		carol.as.mutation(api.work.pulses.setStatus, { pulseId, status: "review" }),
	).rejects.toThrow("not part of this Cycle");
	await expect(
		carol.as.mutation(api.work.pulses.assignToMe, { pulseId }),
	).rejects.toThrow("not part of this Cycle");
});

test("being added to a Cycle notifies the Member, at creation or later", async () => {
	const { bob, carol, createCycle, setup } = await setUpTeam();
	const cycleId = await createCycle("Landing page", [bob]);

	await setup.founder.as.mutation(api.work.cycles.addMember, {
		cycleId,
		userId: carol.userId,
	});

	expect(await notificationTitles(bob.as)).toContain(
		"You were added to the Cycle Landing page",
	);
	expect(await notificationTitles(carol.as)).toContain(
		"You were added to the Cycle Landing page",
	);
});

test("removing a Cycle Member takes their access away", async () => {
	const { bob, createCycle, setup, visibleCycles } = await setUpTeam();
	const cycleId = await createCycle("Landing page", [bob]);

	await setup.founder.as.mutation(api.work.cycles.removeMember, {
		cycleId,
		userId: bob.userId,
	});

	expect(await visibleCycles(bob)).toEqual([]);
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

test("only Members of the Startup can be added, and only by a Founder", async () => {
	const { t, bob, carol, createCycle, setup } = await setUpTeam();
	const cycleId = await createCycle("Landing page", [bob]);
	const outsider = await signUp(t, "Eve");

	await expect(
		setup.founder.as.mutation(api.work.cycles.addMember, {
			cycleId,
			userId: outsider.userId,
		}),
	).rejects.toThrow("not on the team");
	await expect(
		bob.as.mutation(api.work.cycles.addMember, {
			cycleId,
			userId: carol.userId,
		}),
	).rejects.toThrow("Only founders");
});

test("Founders see who is in a Cycle", async () => {
	const { bob, createCycle, setup } = await setUpTeam();
	const cycleId: Id<"cycles"> = await createCycle("Landing page", [bob]);

	const members = await setup.founder.as.query(api.work.cycles.listMembers, {
		cycleId,
	});

	expect(members.map((member) => member.username)).toEqual(["bob"]);
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

test("closing with a carry-over target moves only unfinished Pulses", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await joinAsMember(t, setup, "Alice");
	const { cycleId: fromCycleId, pulseId: donePulseId } = await cyclePulseFor(
		t,
		setup,
		alice,
	);
	const unfinishedPulseId = await alice.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Still going",
		cycleId: fromCycleId,
	});
	await setup.founder.as.mutation(api.work.pulses.setStatus, {
		pulseId: donePulseId,
		status: "review",
	});
	await setup.founder.as.mutation(api.work.pulses.verify, {
		pulseId: donePulseId,
	});

	const toCycleId = await setup.founder.as.mutation(api.work.cycles.create, {
		startupId: setup.startupId,
		title: "Next up",
		startAt: Date.now(),
		endAt: Date.now() + 7 * DAY,
	});

	await setup.founder.as.mutation(api.work.cycles.close, {
		cycleId: fromCycleId,
		carryOverToCycleId: toCycleId,
	});

	const donePulse = await t.run(async (ctx) => await ctx.db.get(donePulseId));
	const unfinishedPulse = await t.run(
		async (ctx) => await ctx.db.get(unfinishedPulseId),
	);
	expect(donePulse?.cycleId).toBe(fromCycleId);
	expect(unfinishedPulse?.cycleId).toBe(toCycleId);
});

test("closing without a carry-over target leaves unfinished Pulses in place", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await joinAsMember(t, setup, "Alice");
	const { cycleId } = await cyclePulseFor(t, setup, alice);
	const unfinishedPulseId = await alice.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Still going",
		cycleId,
	});

	await setup.founder.as.mutation(api.work.cycles.close, { cycleId });

	const pulse = await t.run(async (ctx) => await ctx.db.get(unfinishedPulseId));
	expect(pulse?.cycleId).toBe(cycleId);
	expect(pulse?.status).not.toBe("done");
});

test("removal unassigns unfinished Pulses and keeps Verified Pulse attribution", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await joinAsMember(t, setup, "Alice");
	const { cycleId, pulseId: donePulseId } = await cyclePulseFor(
		t,
		setup,
		alice,
	);
	await setup.founder.as.mutation(api.work.pulses.setStatus, {
		pulseId: donePulseId,
		status: "review",
	});
	await setup.founder.as.mutation(api.work.pulses.verify, {
		pulseId: donePulseId,
	});

	const unfinishedPulseId = await alice.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Half done",
		cycleId,
	});
	await alice.as.mutation(api.work.pulses.assignToMe, {
		pulseId: unfinishedPulseId,
	});

	const membership = await t.run(
		async (ctx) =>
			await ctx.db
				.query("memberships")
				.withIndex("by_startup_and_user", (q) =>
					q.eq("startupId", setup.startupId).eq("userId", alice.userId),
				)
				.unique(),
	);
	if (!membership) {
		throw new Error("No membership");
	}
	await setup.founder.as.mutation(api.teams.members.remove, {
		membershipId: membership._id,
	});

	const donePulse = await t.run(async (ctx) => await ctx.db.get(donePulseId));
	const unfinishedPulse = await t.run(
		async (ctx) => await ctx.db.get(unfinishedPulseId),
	);
	expect(donePulse?.assigneeUserId).toBe(alice.userId);
	expect(unfinishedPulse?.assigneeUserId).toBeUndefined();
});
