import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, joinAsMember, setUpStartup } from "../test.helpers";

async function membershipIdOf(
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	name: string,
) {
	const members = await setup.founder.as.query(api.teams.members.list, {
		startupId: setup.startupId,
	});
	const membership = members.find((member) => member.user.name === name);
	if (!membership) {
		throw new Error(`${name}'s membership not found`);
	}
	return membership._id;
}

test("removing a Member clears their Focused Startup", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");

	await bob.as.mutation(api.teams.startups.focus, {
		startupId: setup.startupId,
	});

	await setup.founder.as.mutation(api.teams.members.remove, {
		membershipId: await membershipIdOf(setup, "Bob"),
	});

	const me = await bob.as.query(api.people.users.getMe, {});
	expect(me?.focusedStartupId).toBeNull();
	expect(
		await bob.as.query(api.teams.startups.listMemberships, {}),
	).toEqual([]);
});

test("removing a Member from a Startup they're not focused on leaves their Focused Startup unchanged", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");

	// Creating Beta focuses Bob on it (create's focusedStartupId patch).
	const { startupId: betaId } = await bob.as.mutation(
		api.teams.startups.create,
		{ name: "Beta" },
	);

	await setup.founder.as.mutation(api.teams.members.remove, {
		membershipId: await membershipIdOf(setup, "Bob"),
	});

	const me = await bob.as.query(api.people.users.getMe, {});
	expect(me?.focusedStartupId).toBe(betaId);
});
