import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import {
	closeWithVerdict,
	createTest,
	notificationTitles,
	scoreOf,
	setUpStartup,
	signUp,
	startedTrialWith,
	type TestConvex,
} from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

async function setUpOffer(t: TestConvex) {
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await closeWithVerdict(t, setup, trialCycleId, alice, "passed_with_offer");
	const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
	return { setup, alice, offer };
}

async function isMemberOf(
	as: Awaited<ReturnType<typeof signUp>>["as"],
	startupName: string,
) {
	const memberships = await as.query(api.teams.startups.listMemberships, {});
	return memberships.some((entry) => entry.startup.name === startupName);
}

test("a passed-with-offer Verdict gives the Participant a pending Offer", async () => {
	const t = createTest();
	const { offer } = await setUpOffer(t);

	expect(offer?.status).toBe("pending");
	expect(offer?.startupName).toBe("Acme");
});

test("accepting an Offer makes the Participant a Member and earns 120 Score", async () => {
	const t = createTest();
	const { setup, alice, offer } = await setUpOffer(t);

	await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });

	expect(await isMemberOf(alice.as, "Acme")).toBe(true);
	expect(await scoreOf(t, alice.userId)).toBe(200);
	expect(await notificationTitles(setup.founder.as)).toContain(
		"Alice accepted your Offer",
	);
});

test("declining an Offer keeps the passed Verdict's Score", async () => {
	const t = createTest();
	const { alice, offer } = await setUpOffer(t);

	await alice.as.mutation(api.hiring.offers.decline, { offerId: offer._id });

	expect(await isMemberOf(alice.as, "Acme")).toBe(false);
	expect(await scoreOf(t, alice.userId)).toBe(80);
});

test("a withdrawn Offer can no longer be accepted", async () => {
	const t = createTest();
	const { setup, alice, offer } = await setUpOffer(t);

	await setup.founder.as.mutation(api.hiring.offers.withdraw, {
		offerId: offer._id,
	});

	expect(await notificationTitles(alice.as)).toContain(
		"Your Offer from Acme was withdrawn",
	);
	await expect(
		alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id }),
	).rejects.toThrow("no longer pending");
});

test("joining by Invite earns no Score", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const { inviteId } = await setup.founder.as.mutation(
		api.teams.invitations.create,
		{
			startupId: setup.startupId,
			invitee: "alice@example.com",
			role: "member",
		},
	);

	await alice.as.mutation(api.teams.invitations.acceptById, { inviteId });

	expect(await isMemberOf(alice.as, "Acme")).toBe(true);
	expect(await scoreOf(t, alice.userId)).toBe(0);
});
