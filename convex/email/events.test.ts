import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import {
	applicant,
	closeHackathon,
	decidedHackathon,
	OFFER_TERMS,
	participants,
	startHackathon,
} from "../applications/applications.setup";
import { cardOn, SHIPPED } from "../cards/cards.setup";
import { publishedHackathon } from "../hackathons/hackathons.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import { advancePast, createTest, DAY } from "../testing/test.setup";

async function emailsTo(setup: Setup, to: string) {
	return await setup.t.run(
		async (ctx) =>
			await ctx.db
				.query("emails")
				.withIndex("by_to", (q) => q.eq("to", to))
				.collect(),
	);
}

async function privateThreadOf(setup: Setup, hackathonId: string) {
	const threads = await setup.founder.as.query(api.threads.list, {
		hackathonId: hackathonId as never,
	});
	const thread = threads.find((candidate) => candidate.kind === "private");
	if (!thread) throw new Error("No private thread");
	return thread._id;
}

describe("event emails", () => {
	it("an accepted Applicant hears they're in", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ana"]);

		expect(await emailsTo(setup, "ana@example.com")).toMatchObject([
			{ kind: "accepted", subject: "You're in: Frontend at Acme" },
		]);
	});

	it("declined Applicants are told, by the Founder or at the start", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");
		await applicant(setup, hackathonId, "Bo");
		await participants(setup, hackathonId, ["Cy"]);
		await setup.founder.as.mutation(api.applications.decline, {
			applicationId: ana.applicationId,
		});
		await startHackathon(setup, hackathonId);

		for (const to of ["ana@example.com", "bo@example.com"]) {
			expect(await emailsTo(setup, to)).toMatchObject([
				{
					kind: "not_selected",
					subject: "Not selected for this one: Frontend at Acme",
				},
			]);
		}
	});

	it("Not this time carries the note", async () => {
		const setup = await setUpStartup(createTest());
		await decidedHackathon(setup, [{ name: "Ana", decision: "not_this_time" }]);

		const [email] = (await emailsTo(setup, "ana@example.com")).filter(
			(e) => e.kind === "not_this_time",
		);
		expect(email.subject).toBe("Not this time: Frontend at Acme");
		expect(email.text).toContain("Thanks for the work");
	});

	it("an Offer carries the terms, and so does a resend", async () => {
		const setup = await setUpStartup(createTest());
		const {
			participants: [ana],
		} = await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);
		await advancePast(setup.t, 15 * DAY);
		await setup.founder.as.mutation(api.applications.resendOffer, {
			applicationId: ana.applicationId,
		});

		const offers = (await emailsTo(setup, "ana@example.com")).filter(
			(e) => e.kind === "offer",
		);
		expect(offers).toHaveLength(2);
		expect(offers[0].subject).toBe("Offer from Acme");
		expect(offers[0].text).toContain(OFFER_TERMS);
	});

	it("a team invite goes to the invited address", async () => {
		const setup = await setUpStartup(createTest());

		await setup.founder.as.mutation(api.invites.create, {
			startupId: setup.startupId,
			email: "Lee@Example.com",
			discipline: "designer",
		});

		expect(await emailsTo(setup, "lee@example.com")).toMatchObject([
			{ kind: "team_invite", subject: "Join Acme on engin" },
		]);
	});

	it("a Card sent back tells its owner, unless they sent it back", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.cards.move, { cardId, to: "in_progress" });
		await sam.as.mutation(api.cards.submit, { cardId, shipped: SHIPPED });

		await setup.founder.as.mutation(api.cards.move, { cardId, to: "todo" });

		expect(await emailsTo(setup, "sam@example.com")).toMatchObject([
			{
				kind: "card_sent_back",
				subject: "Sent back: Write welcome emails",
			},
		]);

		const own = await cardOn(setup, setup.founder, "Pricing page");
		await setup.founder.as.mutation(api.cards.move, {
			cardId: own,
			to: "in_progress",
		});
		await setup.founder.as.mutation(api.cards.submit, {
			cardId: own,
			shipped: SHIPPED,
		});
		const founderEmails = await emailsTo(setup, "fay@example.com");
		expect(founderEmails.filter((e) => e.kind === "card_sent_back")).toEqual(
			[],
		);
	});

	it("after the Hackathon, a private message emails the other person only", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const threadId = await privateThreadOf(setup, hackathonId);
		await ana.as.mutation(api.messages.send, { threadId, body: "During" });
		await closeHackathon(setup, hackathonId);

		await ana.as.mutation(api.messages.send, { threadId, body: "Any news?" });

		const toFounder = (await emailsTo(setup, "fay@example.com")).filter(
			(e) => e.kind === "thread_message",
		);
		expect(toFounder).toHaveLength(1);
		expect(toFounder[0].text).toContain("Any news?");
		const toAna = (await emailsTo(setup, "ana@example.com")).filter(
			(e) => e.kind === "thread_message",
		);
		expect(toAna).toEqual([]);
	});
});
