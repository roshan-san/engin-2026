import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { advancePast, createTest, DAY } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { type Person, signUp } from "../people/users.helpers";
import { cyclePulseFor } from "../work/cycles.helpers";
import { joinAsMember, setUpStartup } from "./startups.helpers";

async function myInvites(person: Person) {
	return await person.as.query(api.teams.invitations.listMine, {});
}

async function startupNames(person: Person) {
	const memberships = await person.as.query(
		api.teams.startups.listMemberships,
		{},
	);
	return memberships.map((entry) => entry.startup.name);
}

test("a Founder invites someone by username, who accepts from their notifications", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await signUp(t, "Bob");

	await setup.founder.as.mutation(api.teams.invitations.create, {
		startupId: setup.startupId,
		invitee: "@Bob",
		role: "member",
	});

	expect(await notificationTitles(bob.as)).toContain(
		"You were invited to Acme",
	);
	const [invite] = await myInvites(bob);
	expect(invite?.startupName).toBe("Acme");
	expect(await startupNames(bob)).toEqual([]);

	await bob.as.mutation(api.teams.invitations.acceptById, {
		inviteId: invite?._id ?? ("" as never),
	});

	expect(await startupNames(bob)).toEqual(["Acme"]);
	expect(await myInvites(bob)).toEqual([]);
});

test("an email Invite for someone not yet on Engin is waiting when they sign up", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);

	await setup.founder.as.mutation(api.teams.invitations.create, {
		startupId: setup.startupId,
		invitee: "Carol@Example.com",
		role: "member",
	});
	const carol = await signUp(t, "Carol");

	const [invite] = await myInvites(carol);
	expect(invite?.startupName).toBe("Acme");
	await carol.as.mutation(api.teams.invitations.acceptById, {
		inviteId: invite?._id ?? ("" as never),
	});
	expect(await startupNames(carol)).toEqual(["Acme"]);
});

test("inviting an unknown username is refused", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);

	await expect(
		setup.founder.as.mutation(api.teams.invitations.create, {
			startupId: setup.startupId,
			invitee: "ghost",
			role: "member",
		}),
	).rejects.toThrow("No one on Engin has the username ghost");
});

test("inviting someone already on the team is refused", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await joinAsMember(setup, "Bob");

	await expect(
		setup.founder.as.mutation(api.teams.invitations.create, {
			startupId: setup.startupId,
			invitee: "bob",
			role: "member",
		}),
	).rejects.toThrow("already on the team");
});

test("re-inviting refreshes the pending Invite instead of duplicating it", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await signUp(t, "Bob");
	const invite = {
		startupId: setup.startupId,
		invitee: "bob",
		role: "member" as const,
	};

	const first = await setup.founder.as.mutation(
		api.teams.invitations.create,
		invite,
	);
	await advancePast(t, 10 * DAY);
	const second = await setup.founder.as.mutation(
		api.teams.invitations.create,
		invite,
	);
	await advancePast(t, 10 * DAY);

	expect(second.inviteId).toBe(first.inviteId);
	expect(await myInvites(bob)).toHaveLength(1);
	await bob.as.mutation(api.teams.invitations.acceptById, {
		inviteId: first.inviteId,
	});
	expect(await startupNames(bob)).toEqual(["Acme"]);
});

test("an Invite expires after 14 days", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await signUp(t, "Bob");
	const { inviteId } = await setup.founder.as.mutation(
		api.teams.invitations.create,
		{
			startupId: setup.startupId,
			invitee: "bob",
			role: "member",
		},
	);

	await advancePast(t, 15 * DAY);

	expect(await myInvites(bob)).toEqual([]);
	await expect(
		bob.as.mutation(api.teams.invitations.acceptById, { inviteId }),
	).rejects.toThrow("expired");
});

test("a declined Invite disappears and cannot be accepted", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await signUp(t, "Bob");
	const { inviteId } = await setup.founder.as.mutation(
		api.teams.invitations.create,
		{
			startupId: setup.startupId,
			invitee: "bob",
			role: "member",
		},
	);

	await bob.as.mutation(api.teams.invitations.decline, { inviteId });

	expect(await myInvites(bob)).toEqual([]);
	await expect(
		bob.as.mutation(api.teams.invitations.acceptById, { inviteId }),
	).rejects.toThrow("no longer valid");
});

test("someone invited as a Founder has full Founder powers", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const cofounder = await signUp(t, "Dana");
	const { inviteId } = await setup.founder.as.mutation(
		api.teams.invitations.create,
		{
			startupId: setup.startupId,
			invitee: "dana",
			role: "founder",
		},
	);
	await cofounder.as.mutation(api.teams.invitations.acceptById, { inviteId });

	const bob = await joinAsMember(setup, "Bob");
	const { pulseId } = await cyclePulseFor(setup, bob);
	await bob.as.mutation(api.work.pulses.setStatus, {
		pulseId,
		status: "review",
	});

	expect(await notificationTitles(cofounder.as)).toContain(
		"Hero section is ready for review",
	);
	await cofounder.as.mutation(api.work.pulses.verify, { pulseId });
});
