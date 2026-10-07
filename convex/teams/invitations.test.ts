import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import {
	closeWithVerdict,
	startedHackathonWith,
} from "../hiring/hackathons.helpers";
import { advancePast, createTest, DAY } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { type Person, signUp } from "../people/users.helpers";
import { cycleTaskFor, submitWithProof } from "../work/cycles.helpers";
import { joinAsMember, type Setup, setUpStartup } from "./startups.helpers";

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
	const { taskId } = await cycleTaskFor(setup, bob);
	await submitWithProof(bob, taskId);

	expect(await notificationTitles(cofounder.as)).toContain(
		"Hero section is ready for review",
	);
	await cofounder.as.mutation(api.work.tasks.verify, { taskId });
});

function invite(setup: Setup, invitee: string, role: "member" | "founder") {
	return setup.founder.as.mutation(api.teams.invitations.create, {
		startupId: setup.startupId,
		invitee,
		role,
	});
}

const FREE_CAP =
	"Your Free plan allows 5 members, counting pending invites and offers";

/** A Free Startup using all 5 slots: 3 Members, 1 Member Invite, 1 Offer. */
async function freeStartupAtCap() {
	const t = createTest();
	const setup = await setUpStartup(t);
	for (const name of ["Ann", "Ben", "Cat"]) {
		await joinAsMember(setup, name);
	}
	const pending = await invite(setup, "dan@example.com", "member");
	const alice = await signUp(t, "Alice");
	const hackathonId = await startedHackathonWith(setup, [alice]);
	await closeWithVerdict(setup, hackathonId, alice, "passed_with_offer");
	return { t, setup, pending };
}

describe("member cap", () => {
	test("a Free Startup can't invite a Member past 5, counting pending invites and offers", async () => {
		const { setup } = await freeStartupAtCap();

		await expect(invite(setup, "eve@example.com", "member")).rejects.toThrow(
			FREE_CAP,
		);
	});

	test("a co-founder invite isn't held back by the cap", async () => {
		const { setup } = await freeStartupAtCap();

		await expect(
			invite(setup, "eve@example.com", "founder"),
		).resolves.toBeDefined();
	});

	test("re-inviting an already pending Member at the cap refreshes it", async () => {
		const { setup, pending } = await freeStartupAtCap();

		const again = await invite(setup, "dan@example.com", "member");

		expect(again.inviteId).toBe(pending.inviteId);
	});

	test("switching a pending co-founder invite to Member needs a free slot", async () => {
		const { setup } = await freeStartupAtCap();
		await invite(setup, "eve@example.com", "founder");

		await expect(invite(setup, "eve@example.com", "member")).rejects.toThrow(
			FREE_CAP,
		);
	});

	test("revoking a pending Member invite frees its slot", async () => {
		const { setup, pending } = await freeStartupAtCap();

		await setup.founder.as.mutation(api.teams.invitations.revoke, {
			inviteId: pending.inviteId,
		});

		await expect(
			invite(setup, "eve@example.com", "member"),
		).resolves.toBeDefined();
	});

	test("a Startup with a Pro Founder invites past 5", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		await t.run(async (ctx) => {
			await ctx.db.patch(setup.founder.userId, { planTier: "pro" });
		});
		for (const name of ["Ann", "Ben", "Cat", "Dan", "Eve"]) {
			await joinAsMember(setup, name);
		}

		await expect(
			invite(setup, "frank@example.com", "member"),
		).resolves.toBeDefined();
	});
});

describe("pending invites", () => {
	test("Founders see only live pending invites", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const bob = await signUp(t, "Bob");
		await signUp(t, "Carol");
		const accepted = await invite(setup, "bob", "member");
		await bob.as.mutation(api.teams.invitations.acceptById, {
			inviteId: accepted.inviteId,
		});
		const revoked = await invite(setup, "carol", "member");
		await setup.founder.as.mutation(api.teams.invitations.revoke, {
			inviteId: revoked.inviteId,
		});
		await invite(setup, "old@example.com", "member");
		await advancePast(t, 15 * DAY);
		await invite(setup, "new@example.com", "founder");

		const pending = await setup.founder.as.query(
			api.teams.invitations.listInvites,
			{ startupId: setup.startupId },
		);

		expect(pending.map((entry) => entry.email)).toEqual(["new@example.com"]);
	});

	test("a revoked invite can't be accepted", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const bob = await signUp(t, "Bob");
		const { inviteId } = await invite(setup, "bob", "member");

		await setup.founder.as.mutation(api.teams.invitations.revoke, {
			inviteId,
		});

		await expect(
			bob.as.mutation(api.teams.invitations.acceptById, { inviteId }),
		).rejects.toThrow("Invite not found");
	});
});

test("someone's pending Invites are listed newest first", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const other = await signUp(t, "Dana");
	const { startupId: betaId } = await other.as.mutation(
		api.teams.startups.create,
		{ name: "Beta" },
	);
	const bob = await signUp(t, "Bob");

	await setup.founder.as.mutation(api.teams.invitations.create, {
		startupId: setup.startupId,
		invitee: "bob",
		role: "member",
	});
	await other.as.mutation(api.teams.invitations.create, {
		startupId: betaId,
		invitee: "bob",
		role: "member",
	});

	const invites = await myInvites(bob);
	expect(invites.map((invite) => invite.startupName)).toEqual(["Beta", "Acme"]);
	expect(invites[0].createdAt).toBeGreaterThanOrEqual(invites[1].createdAt);
});
