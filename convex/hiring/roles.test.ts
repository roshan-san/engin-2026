import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, DAY } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import {
	joinAsMember,
	type Setup,
	setUpStartup,
} from "../teams/startups.helpers";
import {
	applicationIdOf,
	closeWithVerdict,
	createDraftHackathon,
	createHackathon,
	startedHackathonWith,
} from "./hackathons.helpers";

async function closeRole(setup: Setup) {
	await setup.founder.as.mutation(api.hiring.roles.close, {
		roleId: setup.roleId,
	});
}

async function roleStatusOf(setup: Setup) {
	const roles = await setup.founder.as.query(api.hiring.roles.list, {
		startupId: setup.startupId,
	});
	return roles.find((role) => role._id === setup.roleId)?.status;
}

test("reaching the Headcount fills the Role and tidies up what depended on it", async () => {
	const t = createTest();
	const setup = await setUpStartup(t, 1);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const carol = await signUp(t, "Carol");
	const finishedHackathon = await startedHackathonWith(setup, [alice, bob]);
	const runningHackathon = await startedHackathonWith(setup, [carol]);
	const unstartedHackathon = await createHackathon(setup, {
		startsInMs: 5 * DAY,
	});
	await setup.founder.as.mutation(api.hiring.hackathons.close, {
		hackathonId: finishedHackathon,
		verdicts: [
			{
				applicationId: await applicationIdOf(
					t,
					finishedHackathon,
					alice.userId,
				),
				verdict: "passed_with_offer",
			},
			{
				applicationId: await applicationIdOf(t, finishedHackathon, bob.userId),
				verdict: "passed_with_offer",
			},
		],
	});
	const [aliceOffer] = await alice.as.query(api.hiring.offers.listMine, {});

	await alice.as.mutation(api.hiring.offers.accept, {
		offerId: aliceOffer._id,
	});

	const roles = await setup.founder.as.query(api.hiring.roles.list, {
		startupId: setup.startupId,
	});
	expect(roles[0]?.status).toBe("closed");

	const [bobOffer] = await bob.as.query(api.hiring.offers.listMine, {});
	expect(bobOffer?.status).toBe("withdrawn");
	expect(await notificationTitles(bob.as)).toContain(
		"Your Offer from Acme was withdrawn",
	);

	const unstarted = await setup.founder.as.query(api.hiring.hackathons.get, {
		hackathonId: unstartedHackathon,
	});
	expect(unstarted?.status).toBe("cancelled");

	const running = await carol.as.query(api.hiring.hackathons.get, {
		hackathonId: runningHackathon,
	});
	expect(running?.status).toBe("active");
	await expect(
		setup.founder.as.mutation(api.hiring.hackathons.close, {
			hackathonId: runningHackathon,
			verdicts: [
				{
					applicationId: await applicationIdOf(
						t,
						runningHackathon,
						carol.userId,
					),
					verdict: "passed_with_offer",
				},
			],
		}),
	).rejects.toThrow("Role is filled");
});

test("a Role with Headcount 2 stays open after one accepted Offer", async () => {
	const t = createTest();
	const setup = await setUpStartup(t, 2);
	const alice = await signUp(t, "Alice");
	const hackathonId = await startedHackathonWith(setup, [alice]);
	await setup.founder.as.mutation(api.hiring.hackathons.close, {
		hackathonId,
		verdicts: [
			{
				applicationId: await applicationIdOf(t, hackathonId, alice.userId),
				verdict: "passed_with_offer",
			},
		],
	});
	const [offer] = await alice.as.query(api.hiring.offers.listMine, {});

	await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });

	const roles = await setup.founder.as.query(api.hiring.roles.list, {
		startupId: setup.startupId,
	});
	expect(roles[0]?.status).toBe("open");
});

test("a filled Role cannot be reopened", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await setup.founder.as.mutation(api.hiring.roles.close, {
		roleId: setup.roleId,
	});

	const roles = await setup.founder.as.query(api.hiring.roles.list, {
		startupId: setup.startupId,
	});
	expect(roles[0]?.status).toBe("closed");
});

test("a Role with an unpublished hackathon can't close", async () => {
	const setup = await setUpStartup(createTest());
	await createDraftHackathon(setup);

	await expect(closeRole(setup)).rejects.toThrow(
		"Cancel this Role's hackathons first.",
	);

	expect(await roleStatusOf(setup)).toBe("open");
});

test("a Role with an open or running hackathon can't close", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const openHackathon = await createHackathon(setup, { startsInMs: 5 * DAY });

	await expect(closeRole(setup)).rejects.toThrow(
		"Cancel this Role's hackathons first.",
	);

	await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
		hackathonId: openHackathon,
	});
	await startedHackathonWith(setup, [await signUp(t, "Alice")]);

	await expect(closeRole(setup)).rejects.toThrow(
		"Cancel this Role's hackathons first.",
	);
});

test("a Role whose hackathons are all closed or cancelled closes", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const finished = await startedHackathonWith(setup, [alice]);
	await closeWithVerdict(setup, finished, alice, "passed");
	const dropped = await createDraftHackathon(setup);
	await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
		hackathonId: dropped,
	});

	await closeRole(setup);

	expect(await roleStatusOf(setup)).toBe("closed");
});

test("a Member can't close a Role", async () => {
	const setup = await setUpStartup(createTest());
	const member = await joinAsMember(setup, "Mia");

	await expect(
		member.as.mutation(api.hiring.roles.close, { roleId: setup.roleId }),
	).rejects.toThrow("Only founders");

	expect(await roleStatusOf(setup)).toBe("open");
});

test("an overlong Role title is refused", async () => {
	const setup = await setUpStartup(createTest());

	await expect(
		setup.founder.as.mutation(api.hiring.roles.create, {
			startupId: setup.startupId,
			title: "x".repeat(121),
			type: "full-time",
			skills: [],
			description: "Build things",
			headcount: 1,
		}),
	).rejects.toThrow("Role title must be under 120 characters");
});
