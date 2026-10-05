import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	type Client,
	createTest,
	type TestConvex,
} from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { scoreOf, signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { closeWithVerdict, startedTrialWith } from "./trialCycles.helpers";

async function setUpOffer(t: TestConvex) {
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(setup, [alice]);
	await closeWithVerdict(setup, trialCycleId, alice, "passed_with_offer");
	const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
	if (!offer) {
		throw new Error("No Offer");
	}
	return { setup, alice, offer, trialCycleId };
}

async function offerSeenBy(as: Client, trialCycleId: Id<"trialCycles">) {
	const trial = await as.query(api.hiring.trialCycles.get, { trialCycleId });
	return trial?.applicants.map((applicant) => applicant.offer?.status ?? null);
}

async function isMemberOf(as: Client, startupName: string) {
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

describe("offers on the Trial Cycle screen", () => {
	test("founders and members see each Participant's Offer status", async () => {
		const t = createTest();
		const { setup, alice, offer, trialCycleId } = await setUpOffer(t);
		const member = await joinAsMember(setup, "Mo");
		expect(await offerSeenBy(setup.founder.as, trialCycleId)).toEqual([
			"pending",
		]);

		await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });

		expect(await offerSeenBy(setup.founder.as, trialCycleId)).toEqual([
			"accepted",
		]);
		expect(await offerSeenBy(member.as, trialCycleId)).toEqual(["accepted"]);
	});

	test("the Participant sees their own Offer before and after joining the team", async () => {
		const t = createTest();
		const { alice, offer, trialCycleId } = await setUpOffer(t);
		const before = await alice.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(before?.myOffer?.status).toBe("pending");

		await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });

		const after = await alice.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(after?.isMember).toBe(true);
		expect(after?.myVerdict).toBe("passed_with_offer");
		expect(after?.myOffer?.status).toBe("accepted");
	});

	test("declined and withdrawn Offers show as such", async () => {
		const t = createTest();
		const declined = await setUpOffer(t);
		const withdrawn = await setUpOffer(createTest());

		await declined.alice.as.mutation(api.hiring.offers.decline, {
			offerId: declined.offer._id,
		});
		await withdrawn.setup.founder.as.mutation(api.hiring.offers.withdraw, {
			offerId: withdrawn.offer._id,
		});

		expect(
			await offerSeenBy(declined.setup.founder.as, declined.trialCycleId),
		).toEqual(["declined"]);
		expect(
			await offerSeenBy(withdrawn.setup.founder.as, withdrawn.trialCycleId),
		).toEqual(["withdrawn"]);
	});
});

describe("withdrawing an Offer", () => {
	test("a Member who is not a Founder can't withdraw an Offer", async () => {
		const t = createTest();
		const { setup, offer } = await setUpOffer(t);
		const member = await joinAsMember(setup, "Mo");

		await expect(
			member.as.mutation(api.hiring.offers.withdraw, { offerId: offer._id }),
		).rejects.toThrow("Only founders can perform this action");
	});

	test("an accepted Offer can't be withdrawn", async () => {
		const t = createTest();
		const { setup, alice, offer } = await setUpOffer(t);
		await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });

		await expect(
			setup.founder.as.mutation(api.hiring.offers.withdraw, {
				offerId: offer._id,
			}),
		).rejects.toThrow("This Offer is no longer pending");
	});
});

test("a pending Offer links to the Trial Cycle that earned it", async () => {
	const t = createTest();
	const { setup, offer, trialCycleId } = await setUpOffer(t);

	const startup = await t.run(async (ctx) => await ctx.db.get(setup.startupId));

	expect(offer.href).toBe(`/s/${startup?.slug}/trials/${trialCycleId}`);
	expect(offer.createdAt).toBeTypeOf("number");
});
