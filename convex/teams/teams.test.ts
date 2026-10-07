import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { createTest, DAY } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import { joinAsMember, type Setup, setUpStartup } from "./startups.helpers";

async function newTeam(setup: Setup, name: string) {
	return await setup.founder.as.mutation(api.teams.teams.create, {
		startupId: setup.startupId,
		name,
	});
}

async function teamsSeenBy(setup: Setup, as = setup.founder.as) {
	const teams = await as.query(api.teams.teams.list, {
		startupId: setup.startupId,
	});
	return teams.map((team) => ({
		name: team.name,
		members: team.members.map((member) => member.username),
	}));
}

describe("Teams", () => {
	test("a Founder creates a Team and members see it with its people", async () => {
		const setup = await setUpStartup(createTest());
		const bob = await joinAsMember(setup, "Bob");
		const teamId = await newTeam(setup, "Payments");

		await setup.founder.as.mutation(api.teams.teams.addMember, {
			teamId,
			userId: setup.founder.userId,
		});

		expect(await teamsSeenBy(setup, bob.as)).toEqual([
			{ name: "Payments", members: ["founder"] },
		]);
	});

	test("a Member can't create, rename or delete Teams", async () => {
		const setup = await setUpStartup(createTest());
		const bob = await joinAsMember(setup, "Bob");
		const teamId = await newTeam(setup, "Payments");

		const attempts = [
			bob.as.mutation(api.teams.teams.create, {
				startupId: setup.startupId,
				name: "Growth",
			}),
			bob.as.mutation(api.teams.teams.update, { teamId, name: "Billing" }),
			bob.as.mutation(api.teams.teams.remove, { teamId }),
		];

		for (const attempt of attempts) {
			await expect(attempt).rejects.toThrow(
				"Only founders can perform this action",
			);
		}
	});

	test("Team names are unique per Startup, ignoring case", async () => {
		const setup = await setUpStartup(createTest());
		const teamId = await newTeam(setup, "Payments");

		await expect(newTeam(setup, "payments")).rejects.toThrow(
			"A Team with that name already exists",
		);
		await setup.founder.as.mutation(api.teams.teams.update, {
			teamId,
			name: "PAYMENTS",
		});

		expect(await teamsSeenBy(setup)).toEqual([
			{ name: "PAYMENTS", members: [] },
		]);
	});

	test("a Startup holds at most 20 Teams", async () => {
		const setup = await setUpStartup(createTest());
		for (let index = 1; index <= 20; index++) {
			await newTeam(setup, `Team ${index}`);
		}

		await expect(newTeam(setup, "Team 21")).rejects.toThrow(
			"A Startup can have at most 20 Teams",
		);
	});

	test("adding someone outside the Startup fails", async () => {
		const setup = await setUpStartup(createTest());
		const carol = await signUp(setup.t, "Carol");
		const teamId = await newTeam(setup, "Payments");

		await expect(
			setup.founder.as.mutation(api.teams.teams.addMember, {
				teamId,
				userId: carol.userId,
			}),
		).rejects.toThrow("Only members of this Startup can join its Teams");
	});

	test("one person can be in two Teams, and adding twice is a no-op", async () => {
		const setup = await setUpStartup(createTest());
		const bob = await joinAsMember(setup, "Bob");
		const payments = await newTeam(setup, "Payments");
		const growth = await newTeam(setup, "Growth");

		for (const teamId of [payments, growth, payments]) {
			await setup.founder.as.mutation(api.teams.teams.addMember, {
				teamId,
				userId: bob.userId,
			});
		}

		expect(await teamsSeenBy(setup)).toEqual([
			{ name: "Growth", members: ["bob"] },
			{ name: "Payments", members: ["bob"] },
		]);
	});

	test("a Founder takes someone off a Team", async () => {
		const setup = await setUpStartup(createTest());
		const bob = await joinAsMember(setup, "Bob");
		const teamId = await newTeam(setup, "Payments");
		await setup.founder.as.mutation(api.teams.teams.addMember, {
			teamId,
			userId: bob.userId,
		});

		await setup.founder.as.mutation(api.teams.teams.removeMember, {
			teamId,
			userId: bob.userId,
		});

		expect(await teamsSeenBy(setup)).toEqual([
			{ name: "Payments", members: [] },
		]);
	});

	test("adding a member tells them", async () => {
		const setup = await setUpStartup(createTest());
		const bob = await joinAsMember(setup, "Bob");
		const teamId = await newTeam(setup, "Payments");

		await setup.founder.as.mutation(api.teams.teams.addMember, {
			teamId,
			userId: bob.userId,
		});

		expect(await notificationTitles(bob.as)).toContain(
			"You were added to Payments at Acme",
		);
	});

	test("deleting a Team clears it from its Roles and Cycles", async () => {
		const setup = await setUpStartup(createTest());
		const teamId = await newTeam(setup, "Payments");
		await setup.founder.as.mutation(api.hiring.roles.setTeam, {
			roleId: setup.roleId,
			teamId,
		});
		const cycleId: Id<"cycles"> = await setup.founder.as.mutation(
			api.work.cycles.create,
			{
				startupId: setup.startupId,
				title: "Cycle 1",
				goal: "Ship billing",
				startAt: Date.now(),
				endAt: Date.now() + 7 * DAY,
				teamId,
			},
		);

		await setup.founder.as.mutation(api.teams.teams.remove, { teamId });

		const roles = await setup.founder.as.query(api.hiring.roles.list, {
			startupId: setup.startupId,
		});
		const cycle = await setup.founder.as.query(api.work.cycles.get, {
			cycleId,
		});
		expect(roles[0]?.teamId).toBeUndefined();
		expect(cycle?.cycle.teamId).toBeUndefined();
		expect(await teamsSeenBy(setup)).toEqual([]);
	});

	test("creating a Team is logged", async () => {
		const setup = await setUpStartup(createTest());

		await newTeam(setup, "Payments");

		const { activity } = await setup.founder.as.query(
			api.teams.activity.dashboard,
			{ startupId: setup.startupId },
		);
		expect(activity[0]).toMatchObject({
			kind: "team_created",
			summary: 'Team "Payments" created',
		});
	});
});
