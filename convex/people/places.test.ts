import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { addContributor, setUpStartup } from "../startups/startups.setup";
import {
	applicant,
	closeHackathon,
	decidedHackathon,
	endHackathon,
	participants,
	startHackathon,
} from "../testing/applications.setup";
import { SHIPPED } from "../testing/cards.setup";
import {
	draftHackathon,
	publishedHackathon,
} from "../testing/hackathons.setup";
import { createTest } from "../testing/test.setup";
import { type Person, signUp } from "../users/users.setup";

async function placesOf(person: Person) {
	return await person.as.query(api.people.places.list, {});
}

async function threadOf(
	person: Person,
	where: { startupId: Id<"startups"> } | { hackathonId: Id<"hackathons"> },
	kind: "team" | "everyone" | "private",
) {
	const threads = await person.as.query(api.chat.threads.list, where);
	const thread = threads.find((candidate) => candidate.kind === kind);
	if (!thread) {
		throw new Error(`No ${kind} thread`);
	}
	return thread._id;
}

async function say(person: Person, threadId: Id<"threads">) {
	await person.as.mutation(api.chat.messages.send, { threadId, body: "Hello" });
}

/** The Hackathon's Participant Cards as the Participant sees them. */
async function boardOf(hackathonId: Id<"hackathons">, participant: Person) {
	return await participant.as.query(api.work.cards.listParticipantBoard, {
		hackathonId,
		participantId: participant.userId,
	});
}

describe("groups", () => {
	it("your Startups list as Founder and Contributor", async () => {
		const setup = await setUpStartup(createTest());
		const zedFounder = await signUp(setup.t, "Zed");
		const zeta = await zedFounder.as.mutation(api.startups.create, {
			name: "Zeta",
			stage: "building",
			category: "saas",
			city: "pune",
		});
		await setup.t.run(
			async (ctx) =>
				await ctx.db.insert("contributors", {
					startupId: zeta.startupId,
					userId: setup.founder.userId,
				}),
		);

		const places = await placesOf(setup.founder);

		expect(places.startups).toEqual([
			{
				startupId: setup.startupId,
				slug: setup.slug,
				name: "Acme",
				role: "founder",
				logoUrl: null,
				rating: 1000,
				waiting: [],
			},
			{
				startupId: zeta.startupId,
				slug: zeta.slug,
				name: "Zeta",
				role: "contributor",
				logoUrl: null,
				rating: 1000,
				waiting: [],
			},
		]);
	});

	it("a Hackathon you take part in lists under hackathons", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);

		const places = await placesOf(ana);

		expect(places.hackathons).toMatchObject([
			{
				hackathonId,
				job: { role: "frontend", pay: "6_9l", mode: "remote" },
				startupName: "Acme",
				startupSlug: setup.slug,
				startupLogoUrl: null,
				status: "open",
				decision: null,
				waiting: [],
			},
		]);
		expect(places.applied).toEqual([]);
		expect(places.startups).toEqual([]);
	});

	it("an application lists under applied with its status", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const before = await placesOf(ana);
		await setup.founder.as.mutation(api.hiring.applications.decline, {
			applicationId: ana.applicationId,
		});
		const after = await placesOf(ana);

		expect(before.applied).toEqual([
			{
				hackathonId,
				job: { role: "frontend", pay: "6_9l", mode: "remote" },
				startupName: "Acme",
				startupSlug: setup.slug,
				startupLogoUrl: null,
				status: "applied",
			},
		]);
		expect(after.applied).toMatchObject([{ hackathonId, status: "declined" }]);
		expect(after.hackathons).toEqual([]);
	});

	it("applied drops when the Hackathon is done", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ben] = await participants(setup, hackathonId, ["Ben"]);
		const ana = await applicant(setup, hackathonId, "Ana");
		await startHackathon(setup, hackathonId);
		await endHackathon(setup, hackathonId);

		const before = await placesOf(ana);
		await closeHackathon(setup, hackathonId);
		const after = await placesOf(ana);

		expect(before.applied).toHaveLength(1);
		expect(after.applied).toEqual([]);
		expect((await placesOf(ben)).hackathons).toEqual([]);
	});

	it("a Hackathon stays after the decision until the promise is answered, then drops", async () => {
		const setup = await setUpStartup(createTest());
		const {
			hackathonId,
			participants: [ana],
		} = await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);

		const before = await placesOf(ana);
		await ana.as.mutation(api.hiring.applications.keepPromise, {
			applicationId: ana.applicationId,
			kept: true,
		});
		const after = await placesOf(ana);

		expect(before.hackathons).toMatchObject([{ hackathonId }]);
		expect(after.hackathons).toEqual([]);
	});
});

describe("waiting", () => {
	it("an unread Team message lights the Startup", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const threadId = await threadOf(
			cal,
			{ startupId: setup.startupId },
			"team",
		);

		await say(cal, threadId);
		const lit = await placesOf(setup.founder);
		await setup.founder.as.mutation(api.chat.threads.markRead, { threadId });
		const read = await placesOf(setup.founder);

		expect(lit.startups[0].waiting).not.toEqual([]);
		expect(read.startups[0].waiting).toEqual([]);
	});

	it("your own message doesn't light it", async () => {
		const setup = await setUpStartup(createTest());
		await addContributor(setup, "Cal");
		const threadId = await threadOf(
			setup.founder,
			{ startupId: setup.startupId },
			"team",
		);

		await say(setup.founder, threadId);
		const places = await placesOf(setup.founder);

		expect(places.startups[0].waiting).toEqual([]);
	});

	it("a Board Card in Review lights it for the Founder only", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const card = await cal.as.mutation(api.work.cards.create, {
			startupId: setup.startupId,
			title: "Welcome emails",
		});
		await cal.as.mutation(api.work.cards.submit, {
			cardId: card,
			shipped: SHIPPED,
		});

		const founderLit = await placesOf(setup.founder);
		const contributor = await placesOf(cal);
		await setup.founder.as.mutation(api.work.cards.verify, { cardId: card });
		const founderClear = await placesOf(setup.founder);

		expect(founderLit.startups[0].waiting).not.toEqual([]);
		expect(contributor.startups[0].waiting).toEqual([]);
		expect(founderClear.startups[0].waiting).toEqual([]);
	});

	it("an Applicant to screen lights it", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const lit = await placesOf(setup.founder);
		await setup.founder.as.mutation(api.hiring.applications.accept, {
			applicationId: ana.applicationId,
		});
		const screened = await placesOf(setup.founder);

		expect(lit.startups[0].waiting).not.toEqual([]);
		expect(screened.startups[0].waiting).toEqual([]);
	});

	it("a Participant's Card in Review lights it", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const [card] = await boardOf(hackathonId, ana);
		await ana.as.mutation(api.work.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});

		const lit = await placesOf(setup.founder);
		const contributor = await placesOf(cal);
		await setup.founder.as.mutation(api.work.cards.verify, {
			cardId: card._id,
		});
		const clear = await placesOf(setup.founder);

		expect(lit.startups[0].waiting).not.toEqual([]);
		expect(contributor.startups[0].waiting).toEqual([]);
		expect(clear.startups[0].waiting).toEqual([]);
	});

	it("an unread Participant thread lights it for the Founder", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const threadId = await threadOf(ana, { hackathonId }, "private");

		await say(ana, threadId);
		const lit = await placesOf(setup.founder);
		await setup.founder.as.mutation(api.chat.threads.markRead, { threadId });
		const read = await placesOf(setup.founder);

		expect(lit.startups[0].waiting).not.toEqual([]);
		expect(read.startups[0].waiting).toEqual([]);
	});

	it("the Founder's Startup lights when Everyone has an unread message", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const threadId = await threadOf(ana, { hackathonId }, "everyone");

		await say(ana, threadId);

		expect((await placesOf(setup.founder)).startups[0].waiting).not.toEqual([]);
	});

	it("a draft or done Hackathon never lights the Startup", async () => {
		const setup = await setUpStartup(createTest());
		await draftHackathon(setup);
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		await say(ana, await threadOf(ana, { hackathonId }, "everyone"));
		await endHackathon(setup, hackathonId);

		await closeHackathon(setup, hackathonId);

		expect((await placesOf(setup.founder)).startups[0].waiting).toEqual([]);
	});

	it("an undecided Participant while deciding lights it", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana, ben] = await participants(setup, hackathonId, ["Ana", "Ben"]);
		await startHackathon(setup, hackathonId);
		const live = await placesOf(setup.founder);
		await endHackathon(setup, hackathonId);

		const lit = await placesOf(setup.founder);
		for (const participant of [ana, ben]) {
			await setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId: participant.applicationId,
				decision: "not_this_time",
			});
		}
		const decided = await placesOf(setup.founder);

		expect(live.startups[0].waiting).toEqual([]);
		expect(lit.startups[0].waiting).not.toEqual([]);
		expect(decided.startups[0].waiting).toEqual([]);
	});

	it("an unread Everyone message lights the Participant's Hackathon", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		const threadId = await threadOf(setup.founder, { hackathonId }, "everyone");

		await say(setup.founder, threadId);
		const lit = await placesOf(ana);
		await ana.as.mutation(api.chat.threads.markRead, { threadId });
		const read = await placesOf(ana);

		expect(lit.hackathons[0].waiting).not.toEqual([]);
		expect(read.hackathons[0].waiting).toEqual([]);
	});

	it("a decision waiting on the promise lights the Participant's Hackathon", async () => {
		const setup = await setUpStartup(createTest());
		const {
			participants: [ana],
		} = await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);

		const places = await placesOf(ana);

		expect(places.hackathons[0].waiting).not.toEqual([]);
	});

	it("a decision waiting on the promise reads as the promise question", async () => {
		const setup = await setUpStartup(createTest());
		const {
			participants: [ana],
		} = await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);

		const places = await placesOf(ana);

		expect(places.hackathons[0].waiting).toEqual([{ kind: "promise_pending" }]);
	});

	it("an Applicant reads as new applicants on the job", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await applicant(setup, hackathonId, "Ana");
		await applicant(setup, hackathonId, "Bo");

		const places = await placesOf(setup.founder);

		expect(places.startups[0].waiting).toEqual([
			{ kind: "new_applicants", role: "frontend", count: 2 },
		]);
	});

	it("a Card in Review reads as Cards to verify", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const card = await cal.as.mutation(api.work.cards.create, {
			startupId: setup.startupId,
			title: "Welcome emails",
		});
		await cal.as.mutation(api.work.cards.submit, {
			cardId: card,
			shipped: SHIPPED,
		});

		const places = await placesOf(setup.founder);

		expect(places.startups[0].waiting).toEqual([
			{ kind: "cards_to_verify", count: 1 },
		]);
	});

	it("nothing pending leaves every dot off", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);

		const places = [setup.founder, cal, ana].map(placesOf);

		for (const place of await Promise.all(places)) {
			expect(place.startups.map((row) => row.waiting)).toEqual(
				place.startups.map(() => []),
			);
			expect(place.hackathons.map((row) => row.waiting)).toEqual(
				place.hackathons.map(() => []),
			);
		}
	});
});

it("places need sign-in", async () => {
	const t = createTest();

	await expect(t.query(api.people.places.list, {})).rejects.toThrow(
		"Not authenticated",
	);
});
