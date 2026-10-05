import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import { cyclePulseFor } from "../work/cycles.helpers";
import {
	joinAsCoFounder,
	joinAsMember,
	type Setup,
	setUpStartup,
} from "./startups.helpers";

async function membershipOf(setup: Setup, username: string) {
	const members = await setup.founder.as.query(api.teams.members.list, {
		startupId: setup.startupId,
	});
	const member = members.find((entry) => entry.user.username === username);
	if (!member) {
		throw new Error(`${username} is not on the team`);
	}
	return member._id;
}

test("a Member sees the whole team with roles; an outsider is refused", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const carol = await signUp(t, "Carol");

	const team = await bob.as.query(api.teams.members.list, {
		startupId: setup.startupId,
	});

	expect(team.map((entry) => [entry.user.username, entry.role])).toEqual(
		expect.arrayContaining([
			["founder", "founder"],
			["bob", "member"],
		]),
	);
	await expect(
		carol.as.query(api.teams.members.list, { startupId: setup.startupId }),
	).rejects.toThrow("You are not a member of this startup");
});

test("a removed Member loses the Startup and its Cycles, is notified, and the feed records it", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const { cycleId } = await cyclePulseFor(setup, bob);
	await bob.as.mutation(api.teams.startups.focus, {
		startupId: setup.startupId,
	});

	await setup.founder.as.mutation(api.teams.members.remove, {
		membershipId: await membershipOf(setup, "bob"),
	});

	await expect(
		bob.as.query(api.teams.members.list, { startupId: setup.startupId }),
	).rejects.toThrow("You are not a member of this startup");
	expect(await bob.as.query(api.work.cycles.get, { cycleId })).toBeNull();
	expect(await notificationTitles(bob.as)).toContain(
		"You were removed from Acme",
	);
	expect(
		(await bob.as.query(api.people.users.getMe, {}))?.focusedStartupId,
	).toBeFalsy();
	const { activity } = await setup.founder.as.query(
		api.teams.activity.dashboard,
		{ startupId: setup.startupId },
	);
	expect(activity[0]?.summary).toBe("Bob was removed from the team");
});

test("a Member who rejoins is not back on the Cycles they were removed from", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	await cyclePulseFor(setup, bob);
	await setup.founder.as.mutation(api.teams.members.remove, {
		membershipId: await membershipOf(setup, "bob"),
	});

	const { inviteId } = await setup.founder.as.mutation(
		api.teams.invitations.create,
		{ startupId: setup.startupId, invitee: "bob", role: "member" },
	);
	await bob.as.mutation(api.teams.invitations.acceptById, { inviteId });

	expect(
		await bob.as.query(api.work.cycles.list, { startupId: setup.startupId }),
	).toEqual([]);
});

test("co-founders can't be removed", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await joinAsCoFounder(setup, "Dana");

	await expect(
		setup.founder.as.mutation(api.teams.members.remove, {
			membershipId: await membershipOf(setup, "dana"),
		}),
	).rejects.toThrow("Co-founders can't be removed");
	await expect(
		setup.founder.as.mutation(api.teams.members.remove, {
			membershipId: await membershipOf(setup, "founder"),
		}),
	).rejects.toThrow("Co-founders can't be removed");
});

test("a Member can't remove anyone", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	await joinAsMember(setup, "Carol");

	await expect(
		bob.as.mutation(api.teams.members.remove, {
			membershipId: await membershipOf(setup, "carol"),
		}),
	).rejects.toThrow("Only founders can perform this action");
});
