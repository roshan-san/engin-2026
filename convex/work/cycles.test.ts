import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { advancePast, createTest, DAY } from "../lib/testing.helpers";
import { type Person, signUp } from "../people/users.helpers";
import {
	joinAsCoFounder,
	joinAsMember,
	setUpStartup,
} from "../teams/startups.helpers";

async function setUpTeam() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const carol = await joinAsMember(setup, "Carol");

	async function createCycle(title: string, members: Person[] = []) {
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

	async function statusOf(cycleId: Id<"cycles">) {
		const view = await setup.founder.as.query(api.work.cycles.get, {
			cycleId,
		});
		return view?.cycle.status;
	}

	async function addPulse(
		person: Person,
		cycleId: Id<"cycles">,
		title: string,
	) {
		return await person.as.mutation(api.work.pulses.create, {
			startupId: setup.startupId,
			title,
			cycleId,
		});
	}

	async function boardOf(cycleId: Id<"cycles">) {
		const pulses = await setup.founder.as.query(api.work.pulses.listForCycle, {
			cycleId,
		});
		return pulses.map((pulse) => `${pulse.title}:${pulse.status}`).sort();
	}

	async function notificationTitles(person: Person) {
		const { notifications } = await person.as.query(
			api.people.notifications.list,
			{},
		);
		return notifications.map((notification) => notification.title);
	}

	async function activitySummaries() {
		const { activity } = await setup.founder.as.query(
			api.teams.activity.dashboard,
			{ startupId: setup.startupId },
		);
		return activity.map((row) => row.summary);
	}

	return {
		t,
		setup,
		bob,
		carol,
		createCycle,
		visibleCycles,
		statusOf,
		addPulse,
		boardOf,
		notificationTitles,
		activitySummaries,
	};
}

describe("seeing Cycles", () => {
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

	test("a Member outside a Cycle gets nothing for it and cannot touch its Pulses, even by id", async () => {
		const { setup, bob, carol, createCycle } = await setUpTeam();
		const cycleId = await createCycle("Landing page", [bob]);
		const pulseId = await bob.as.mutation(api.work.pulses.create, {
			startupId: setup.startupId,
			title: "Hero",
			cycleId,
		});

		expect(await carol.as.query(api.work.cycles.get, { cycleId })).toBeNull();
		await expect(
			carol.as.query(api.work.pulses.listForCycle, { cycleId }),
		).rejects.toThrow("You are not part of this Cycle");
		await expect(
			carol.as.mutation(api.work.pulses.create, {
				startupId: setup.startupId,
				title: "Sneaky",
				cycleId,
			}),
		).rejects.toThrow("You are not part of this Cycle");
		await expect(
			carol.as.mutation(api.work.pulses.setStatus, {
				pulseId,
				status: "review",
			}),
		).rejects.toThrow("You are not part of this Cycle");
		await expect(
			carol.as.mutation(api.work.pulses.assignToMe, { pulseId }),
		).rejects.toThrow("You are not part of this Cycle");
	});

	test("a co-founder belongs to every Cycle without being added", async () => {
		const { setup, createCycle, visibleCycles } = await setUpTeam();
		await createCycle("Landing page");
		const dana = await joinAsCoFounder(setup, "Dana");

		expect(await visibleCycles(dana)).toEqual(["Landing page"]);
	});

	test("the Cycle screen lists its Members, and planned Cycles only for Founders", async () => {
		const { setup, bob, createCycle } = await setUpTeam();
		const cycleId = await createCycle("Landing page", [bob]);
		await createCycle("Billing", [bob]);

		const asBob = await bob.as.query(api.work.cycles.get, { cycleId });
		const asFounder = await setup.founder.as.query(api.work.cycles.get, {
			cycleId,
		});

		expect(asBob?.members.map((member) => member.name)).toEqual(["Bob"]);
		expect(asBob?.isFounder).toBe(false);
		expect(asBob?.plannedCycles).toEqual([]);
		expect(asFounder?.plannedCycles.map((cycle) => cycle.title).sort()).toEqual(
			["Billing", "Landing page"],
		);
	});
});

describe("creating", () => {
	test("a Founder's new Cycle starts out planned", async () => {
		const { createCycle, statusOf } = await setUpTeam();

		const cycleId = await createCycle("Cycle 12");

		expect(await statusOf(cycleId)).toBe("planned");
	});

	test("a Cycle must end after it starts", async () => {
		const { setup } = await setUpTeam();

		await expect(
			setup.founder.as.mutation(api.work.cycles.create, {
				startupId: setup.startupId,
				title: "Backwards",
				startAt: Date.now(),
				endAt: Date.now() - DAY,
			}),
		).rejects.toThrow("Cycle end must be after start");
	});

	test("a Member cannot create a Cycle", async () => {
		const { setup, bob } = await setUpTeam();

		await expect(
			bob.as.mutation(api.work.cycles.create, {
				startupId: setup.startupId,
				title: "Mine",
				startAt: Date.now(),
				endAt: Date.now() + DAY,
			}),
		).rejects.toThrow("Only founders can perform this action");
	});
});

describe("starting", () => {
	test("a planned Cycle stays planned past its start date until a Founder starts it", async () => {
		const { t, setup, statusOf } = await setUpTeam();
		const cycleId = await setup.founder.as.mutation(api.work.cycles.create, {
			startupId: setup.startupId,
			title: "Sprint",
			startAt: Date.now() + DAY,
			endAt: Date.now() + 8 * DAY,
		});

		await advancePast(t, 2 * DAY);

		expect(await statusOf(cycleId)).toBe("planned");
	});

	test("starting makes the Cycle active, tells its Members and logs it", async () => {
		const {
			setup,
			bob,
			createCycle,
			statusOf,
			notificationTitles,
			activitySummaries,
		} = await setUpTeam();
		const cycleId = await createCycle("Billing", [bob]);

		await setup.founder.as.mutation(api.work.cycles.start, { cycleId });

		expect(await statusOf(cycleId)).toBe("active");
		expect(await notificationTitles(bob)).toContain("Cycle Billing started");
		expect(await activitySummaries()).toContain('Cycle "Billing" started');
	});

	test("a co-founder hears when another Founder starts a Cycle", async () => {
		const { setup, createCycle, notificationTitles } = await setUpTeam();
		const dana = await joinAsCoFounder(setup, "Dana");
		const cycleId = await createCycle("Billing");

		await setup.founder.as.mutation(api.work.cycles.start, { cycleId });

		expect(await notificationTitles(dana)).toContain("Cycle Billing started");
		expect(await notificationTitles(setup.founder)).not.toContain(
			"Cycle Billing started",
		);
	});

	test("only one Cycle is active at a time", async () => {
		const { setup, createCycle } = await setUpTeam();
		const launch = await createCycle("Launch");
		const billing = await createCycle("Billing");
		await setup.founder.as.mutation(api.work.cycles.start, {
			cycleId: launch,
		});

		await expect(
			setup.founder.as.mutation(api.work.cycles.start, { cycleId: billing }),
		).rejects.toThrow("Close the active Cycle before starting another");
	});

	test("only a planned Cycle can be started, and only by a Founder", async () => {
		const { setup, bob, createCycle } = await setUpTeam();
		const cycleId = await createCycle("Launch", [bob]);

		await expect(
			bob.as.mutation(api.work.cycles.start, { cycleId }),
		).rejects.toThrow("Only founders can perform this action");
		await setup.founder.as.mutation(api.work.cycles.start, { cycleId });
		await expect(
			setup.founder.as.mutation(api.work.cycles.start, { cycleId }),
		).rejects.toThrow("Only a planned Cycle can be started");
	});
});

describe("closing", () => {
	async function setUpLaunch() {
		const team = await setUpTeam();
		const { setup, bob, createCycle, addPulse } = team;
		const launch = await createCycle("Launch", [bob]);
		const billing = await createCycle("Billing");
		await setup.founder.as.mutation(api.work.cycles.start, {
			cycleId: launch,
		});

		const shipped = await addPulse(bob, launch, "Shipped");
		await bob.as.mutation(api.work.pulses.assignToMe, { pulseId: shipped });
		await bob.as.mutation(api.work.pulses.setStatus, {
			pulseId: shipped,
			status: "review",
		});
		await setup.founder.as.mutation(api.work.pulses.verify, {
			pulseId: shipped,
		});
		const hero = await addPulse(bob, launch, "Hero");
		await bob.as.mutation(api.work.pulses.assignToMe, { pulseId: hero });
		await addPulse(bob, launch, "Footer");
		const pricing = await addPulse(bob, launch, "Pricing");
		await bob.as.mutation(api.work.pulses.setStatus, {
			pulseId: pricing,
			status: "review",
		});

		return { ...team, launch, billing };
	}

	test("closing with carry-over moves unfinished Pulses as they are and keeps Done ones", async () => {
		const { setup, launch, billing, statusOf, boardOf } = await setUpLaunch();

		await setup.founder.as.mutation(api.work.cycles.close, {
			cycleId: launch,
			carryOverToCycleId: billing,
		});

		expect(await statusOf(launch)).toBe("closed");
		expect(await boardOf(launch)).toEqual(["Shipped:done"]);
		expect(await boardOf(billing)).toEqual([
			"Footer:todo",
			"Hero:in_progress",
			"Pricing:review",
		]);
	});

	test("an assignee follows their carried-over Pulse into the next Cycle", async () => {
		const { setup, bob, launch, billing, visibleCycles } = await setUpLaunch();

		await setup.founder.as.mutation(api.work.cycles.close, {
			cycleId: launch,
			carryOverToCycleId: billing,
		});

		expect((await visibleCycles(bob)).sort()).toEqual(["Billing", "Launch"]);
		const pulses = await bob.as.query(api.work.pulses.listForCycle, {
			cycleId: billing,
		});
		expect(pulses.map((pulse) => pulse.title)).toContain("Hero");
	});

	test("closing without carry-over leaves unfinished Pulses on the closed Cycle", async () => {
		const { setup, launch, statusOf, boardOf } = await setUpLaunch();

		await setup.founder.as.mutation(api.work.cycles.close, { cycleId: launch });

		expect(await statusOf(launch)).toBe("closed");
		expect(await boardOf(launch)).toHaveLength(4);
	});

	test("closing tells the Cycle's Members and logs it", async () => {
		const { setup, bob, launch, notificationTitles, activitySummaries } =
			await setUpLaunch();

		await setup.founder.as.mutation(api.work.cycles.close, { cycleId: launch });

		expect(await notificationTitles(bob)).toContain("Cycle Launch closed");
		expect(await activitySummaries()).toContain('Cycle "Launch" closed');
	});

	test("unfinished Pulses carry over only to a planned Cycle", async () => {
		const { setup, launch, createCycle } = await setUpLaunch();
		const other = await setUpStartup(setup.t);
		const elsewhere = await other.founder.as.mutation(api.work.cycles.create, {
			startupId: other.startupId,
			title: "Elsewhere",
			startAt: Date.now(),
			endAt: Date.now() + DAY,
		});
		const closed = await createCycle("Old");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(closed, { status: "closed" });
		});

		for (const target of [launch, closed, elsewhere]) {
			await expect(
				setup.founder.as.mutation(api.work.cycles.close, {
					cycleId: launch,
					carryOverToCycleId: target,
				}),
			).rejects.toThrow(
				"Unfinished Pulses can only carry over to a planned Cycle",
			);
		}
	});

	test("only an active Cycle can be closed, and only by a Founder", async () => {
		const { setup, bob, launch, billing } = await setUpLaunch();

		await expect(
			bob.as.mutation(api.work.cycles.close, { cycleId: launch }),
		).rejects.toThrow("Only founders can perform this action");
		await expect(
			setup.founder.as.mutation(api.work.cycles.close, { cycleId: billing }),
		).rejects.toThrow("Only an active Cycle can be closed");
	});
});

describe("Cycle Members", () => {
	test("a Founder adds a Member, who then sees the Cycle and is notified", async () => {
		const { setup, carol, createCycle, visibleCycles, notificationTitles } =
			await setUpTeam();
		const cycleId = await createCycle("Billing");

		await setup.founder.as.mutation(api.work.cycles.addMember, {
			cycleId,
			userId: carol.userId,
		});

		expect(await visibleCycles(carol)).toEqual(["Billing"]);
		expect(await notificationTitles(carol)).toContain(
			"You were added to the Cycle Billing",
		);
	});

	test("a Founder removes a Member, who then no longer sees the Cycle", async () => {
		const { setup, bob, createCycle, visibleCycles } = await setUpTeam();
		const cycleId = await createCycle("Billing", [bob]);

		await setup.founder.as.mutation(api.work.cycles.removeMember, {
			cycleId,
			userId: bob.userId,
		});

		expect(await visibleCycles(bob)).toEqual([]);
	});

	test("Founders and people off the team cannot be added", async () => {
		const { t, setup, createCycle } = await setUpTeam();
		const cycleId = await createCycle("Billing");
		const dana = await joinAsCoFounder(setup, "Dana");
		const stranger = await signUp(t, "Stranger");

		await expect(
			setup.founder.as.mutation(api.work.cycles.addMember, {
				cycleId,
				userId: dana.userId,
			}),
		).rejects.toThrow("Founders already belong to every Cycle");
		await expect(
			setup.founder.as.mutation(api.work.cycles.addMember, {
				cycleId,
				userId: stranger.userId,
			}),
		).rejects.toThrow("That user is not on the team");
	});

	test("a closed Cycle's Members don't change, and only Founders manage them", async () => {
		const { setup, bob, carol, createCycle } = await setUpTeam();
		const cycleId = await createCycle("Billing", [bob]);

		await expect(
			bob.as.mutation(api.work.cycles.addMember, {
				cycleId,
				userId: carol.userId,
			}),
		).rejects.toThrow("Only founders can perform this action");

		await setup.founder.as.mutation(api.work.cycles.start, { cycleId });
		await setup.founder.as.mutation(api.work.cycles.close, { cycleId });

		await expect(
			setup.founder.as.mutation(api.work.cycles.addMember, {
				cycleId,
				userId: carol.userId,
			}),
		).rejects.toThrow("This Cycle is closed");
		await expect(
			setup.founder.as.mutation(api.work.cycles.removeMember, {
				cycleId,
				userId: bob.userId,
			}),
		).rejects.toThrow("This Cycle is closed");
	});
});
