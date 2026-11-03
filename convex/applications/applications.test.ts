import { describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { SHIPPED } from "../cards/cards.setup";
import { nextMonday, publishedHackathon } from "../hackathons/hackathons.setup";
import { MAX_APPLICATIONS } from "../hackathons/rules";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import { advancePast, createTest, DAY, HOUR } from "../testing/test.setup";
import {
	type Applicant,
	applicant,
	closeHackathon,
	decidedHackathon,
	endHackathon,
	OFFER_TERMS,
	participants,
	startHackathon,
} from "./applications.setup";
import { offerState, WALKTHROUGH_QUESTIONS } from "./rules";

async function boardOf(hackathonId: Id<"hackathons">, participant: Applicant) {
	return await participant.as.query(api.cards.listParticipantBoard, {
		hackathonId,
		participantId: participant.userId,
	});
}

async function activityKinds(setup: Setup) {
	const { cycles } = await setup.founder.as.query(api.activity.list, {
		startupId: setup.startupId,
	});
	return cycles.flatMap((cycle) => cycle.entries.map((entry) => entry.kind));
}

async function threadsFor(setup: Setup, hackathonId: Id<"hackathons">) {
	return await setup.t.run(
		async (ctx) =>
			await ctx.db
				.query("threads")
				.withIndex("by_hackathon_and_kind", (q) =>
					q.eq("hackathonId", hackathonId).eq("kind", "private"),
				)
				.take(20),
	);
}

/** A crowd of applicants, more than one read can hold. No API inserts in bulk. */
async function crowd(
	setup: Setup,
	hackathonId: Id<"hackathons">,
	count: number,
) {
	await setup.t.run(async (ctx) => {
		for (let i = 0; i < count; i++) {
			const userId = await ctx.db.insert("users", {
				name: `Crowd${i}`,
				email: `crowd${i}@example.com`,
			});
			await ctx.db.insert("applications", {
				hackathonId,
				userId,
				answer: "Pick me",
				status: "applied",
				shortlisted: false,
			});
		}
	});
}

describe("applying", () => {
	it("a person applies once", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const again = ana.as.mutation(api.applications.apply, {
			hackathonId,
			answer: "Me again",
		});
		const hackathon = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});

		await expect(again).rejects.toThrow("You've already applied");
		expect(hackathon).toMatchObject({
			applicantCount: 1,
			myApplication: null,
		});
	});

	it("the Founder and team can't apply", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const sam = await addContributor(setup, "Sam");

		const founder = setup.founder.as.mutation(api.applications.apply, {
			hackathonId,
			answer: "Hire me",
		});
		const contributor = sam.as.mutation(api.applications.apply, {
			hackathonId,
			answer: "Hire me",
		});

		await expect(founder).rejects.toThrow("You're on this startup");
		await expect(contributor).rejects.toThrow("You're on this startup");
	});

	it("only the Founder accepts applicants", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");
		const ben = await applicant(setup, hackathonId, "Ben");

		const accept = ben.as.mutation(api.applications.accept, {
			applicationId: ana.applicationId,
		});

		await expect(accept).rejects.toThrow("You're not on this startup");
	});

	it("the 11th Participant is refused", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const names = Array.from({ length: 10 }, (_, i) => `Participant${i}`);
		await participants(setup, hackathonId, names);
		const eleventh = await applicant(setup, hackathonId, "Eleven");

		const accept = setup.founder.as.mutation(api.applications.accept, {
			applicationId: eleventh.applicationId,
		});

		await expect(accept).rejects.toThrow("10 Builders is the limit");
	});

	it("a Participant is accepted once, and an Applicant declined once", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		const ben = await applicant(setup, hackathonId, "Ben");
		await setup.founder.as.mutation(api.applications.decline, {
			applicationId: ben.applicationId,
		});

		const acceptAgain = setup.founder.as.mutation(api.applications.accept, {
			applicationId: ana.applicationId,
		});
		const declineAgain = setup.founder.as.mutation(api.applications.decline, {
			applicationId: ben.applicationId,
		});

		await expect(acceptAgain).rejects.toThrow("They're already a Builder");
		await expect(declineAgain).rejects.toThrow("They're already declined");
	});

	it("declining a Participant before the start frees their place", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const names = Array.from({ length: 10 }, (_, i) => `Participant${i}`);
		const [first] = await participants(setup, hackathonId, names);
		const eleventh = await applicant(setup, hackathonId, "Eleven");

		await setup.founder.as.mutation(api.applications.decline, {
			applicationId: first.applicationId,
		});
		await setup.founder.as.mutation(api.applications.accept, {
			applicationId: eleventh.applicationId,
		});
		const list = await setup.founder.as.query(api.hackathons.list, {
			startupId: setup.startupId,
		});

		expect(list[0].participantCount).toBe(10);
	});

	it("accepting gives the Participant one private Thread, even after a decline", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");
		const accept = () =>
			setup.founder.as.mutation(api.applications.accept, {
				applicationId: ana.applicationId,
			});

		await accept();
		await setup.founder.as.mutation(api.applications.decline, {
			applicationId: ana.applicationId,
		});
		await accept();

		expect(await threadsFor(setup, hackathonId)).toMatchObject([
			{ kind: "private", participantId: ana.userId },
		]);
	});

	it("at the start, applicants not picked are declined and Participants get their own Cards", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana, ben] = await participants(setup, hackathonId, ["Ana", "Ben"]);
		const cal = await applicant(setup, hackathonId, "Cal");

		await startHackathon(setup, hackathonId);

		const hackathon = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});
		const calView = await cal.as.query(api.hackathons.getPublic, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("live");
		expect(calView?.myApplication?.status).toBe("declined");
		const anaCards = await boardOf(hackathonId, ana);
		const benCards = await boardOf(hackathonId, ben);
		expect(anaCards).toHaveLength(3);
		expect(benCards).toHaveLength(3);
		expect(anaCards.every((card) => card.owner?._id === ana.userId)).toBe(true);
	});

	it("at the start, every applicant not picked is declined, however many applied", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ana"]);
		await crowd(setup, hackathonId, MAX_APPLICATIONS + 1);

		await startHackathon(setup, hackathonId);

		const stillApplied = await setup.t.run(
			async (ctx) =>
				await ctx.db
					.query("applications")
					.withIndex("by_hackathon_and_status", (q) =>
						q.eq("hackathonId", hackathonId).eq("status", "applied"),
					)
					.take(1),
		);
		const hackathon = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});
		expect(stillApplied).toEqual([]);
		expect(hackathon?.status).toBe("live");
	});

	it("the Founder always sees their Participants, however many applied", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await crowd(setup, hackathonId, MAX_APPLICATIONS);

		const list = await setup.founder.as.query(
			api.applications.listForHackathon,
			{ hackathonId },
		);

		expect(list).toHaveLength(MAX_APPLICATIONS + 1);
		expect(list[0]).toMatchObject({
			application: { _id: ana.applicationId, status: "participating" },
		});
	});

	it("nobody joins after the start", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ana"]);
		const cal = await applicant(setup, hackathonId, "Cal");
		await startHackathon(setup, hackathonId);

		const accept = setup.founder.as.mutation(api.applications.accept, {
			applicationId: cal.applicationId,
		});
		const late = applicant(setup, hackathonId, "Dee");

		await expect(accept).rejects.toThrow("Applications are closed");
		await expect(late).rejects.toThrow("Applications are closed");
	});

	it("the Founder sees applicants with their Momentum and no email", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const list = await setup.founder.as.query(
			api.applications.listForHackathon,
			{ hackathonId },
		);
		const asApplicant = ana.as.query(api.applications.listForHackathon, {
			hackathonId,
		});

		expect(list).toMatchObject([
			{
				application: { _id: ana.applicationId, status: "applied" },
				user: {
					_id: ana.userId,
					name: "Ana",
					momentum: 1000,
					isProvisional: true,
				},
			},
		]);
		expect(JSON.stringify(list)).not.toContain("@example.com");
		await expect(asApplicant).rejects.toThrow("You're not on this startup");
	});
});

describe("screening", () => {
	it("the Founder sees an Applicant's record without a username", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");
		await setup.t.run(
			async (ctx) => await ctx.db.patch(ana.userId, { username: undefined }),
		);

		const view = await setup.founder.as.query(api.applications.getApplicant, {
			applicationId: ana.applicationId,
		});

		expect(view).toMatchObject({
			application: { status: "applied", answer: "I'm Ana and I fix signups." },
			user: { name: "Ana", username: null, momentum: 1000 },
			record: { hackathons: [], work: [] },
		});
	});

	it("only the Founder can see an Applicant", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const forSam = sam.as.query(api.applications.getApplicant, {
			applicationId: ana.applicationId,
		});
		const forAna = ana.as.query(api.applications.getApplicant, {
			applicationId: ana.applicationId,
		});

		await expect(forSam).rejects.toThrow("Only the Founder can do this");
		await expect(forAna).rejects.toThrow("You're not on this startup");
	});
});

describe("live", () => {
	async function twoParticipants() {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana, ben] = await participants(setup, hackathonId, ["Ana", "Ben"]);
		await startHackathon(setup, hackathonId);
		const [anaCard] = await boardOf(hackathonId, ana);
		const [benCard] = await boardOf(hackathonId, ben);
		return { setup, hackathonId, ana, ben, anaCard, benCard };
	}

	it("a Participant works only their own Cards", async () => {
		const { hackathonId, ana, ben, benCard } = await twoParticipants();

		const read = ana.as.query(api.cards.listParticipantBoard, {
			hackathonId,
			participantId: ben.userId,
		});
		const submit = ana.as.mutation(api.cards.submit, {
			cardId: benCard._id,
			shipped: SHIPPED,
		});
		const move = ana.as.mutation(api.cards.move, {
			cardId: benCard._id,
			to: "in_progress",
		});
		const update = ana.as.mutation(api.cards.update, {
			cardId: benCard._id,
			notes: "Mine now",
		});

		await expect(read).rejects.toThrow("This Card isn't yours");
		await expect(submit).rejects.toThrow("This Card isn't yours");
		await expect(move).rejects.toThrow("This Card isn't yours");
		await expect(update).rejects.toThrow("This Card isn't yours");
	});

	it("the team doesn't work a Participant's Cards", async () => {
		const { setup, hackathonId, ana, anaCard } = await twoParticipants();
		const sam = await addContributor(setup, "Sam");

		const read = sam.as.query(api.cards.listParticipantBoard, {
			hackathonId,
			participantId: ana.userId,
		});
		const move = sam.as.mutation(api.cards.move, {
			cardId: anaCard._id,
			to: "in_progress",
		});

		await expect(read).rejects.toThrow("This Card isn't yours");
		await expect(move).rejects.toThrow("This Card isn't yours");
	});

	it("a Participant moves and submits their own Card but can't remove it", async () => {
		const { ana, anaCard } = await twoParticipants();

		await ana.as.mutation(api.cards.move, {
			cardId: anaCard._id,
			to: "in_progress",
		});
		await ana.as.mutation(api.cards.submit, {
			cardId: anaCard._id,
			shipped: SHIPPED,
		});
		const remove = ana.as.mutation(api.cards.remove, {
			cardId: anaCard._id,
		});

		await expect(remove).rejects.toThrow(
			"Hackathon Cards stay with their Builder",
		);
	});

	it("a Participant can't hand their Card to someone else", async () => {
		const { ana, ben, anaCard } = await twoParticipants();

		const update = ana.as.mutation(api.cards.update, {
			cardId: anaCard._id,
			ownerId: ben.userId,
		});

		await expect(update).rejects.toThrow(
			"Hackathon Cards stay with their Builder",
		);
	});

	it("the Founder can't delete a Participant's Card", async () => {
		const { setup, anaCard } = await twoParticipants();

		const remove = setup.founder.as.mutation(api.cards.remove, {
			cardId: anaCard._id,
		});

		await expect(remove).rejects.toThrow(
			"Hackathon Cards stay with their Builder",
		);
	});

	it("a declined applicant can't work the Cards", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ana"]);
		const cal = await applicant(setup, hackathonId, "Cal");
		await startHackathon(setup, hackathonId);

		const read = cal.as.query(api.cards.listParticipantBoard, {
			hackathonId,
			participantId: cal.userId,
		});

		await expect(read).rejects.toThrow("This Card isn't yours");
	});

	it("Participants stop working when the Hackathon ends", async () => {
		const { setup, hackathonId, ana, anaCard } = await twoParticipants();

		await endHackathon(setup, hackathonId);
		const move = ana.as.mutation(api.cards.move, {
			cardId: anaCard._id,
			to: "in_progress",
		});

		await expect(move).rejects.toThrow("This Hackathon isn't running");
	});

	it("Participants stop working at the end, before the Hackathon moves to deciding", async () => {
		const { setup, hackathonId, ana, anaCard } = await twoParticipants();
		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		if (!hackathon) throw new Error("Hackathon not found");

		vi.setSystemTime(hackathon.endsAt);
		const move = ana.as.mutation(api.cards.move, {
			cardId: anaCard._id,
			to: "in_progress",
		});

		await expect(move).rejects.toThrow("This Hackathon isn't running");
		const stored = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		expect(stored?.status).toBe("live");
	});

	it("a Participant's work goes through the Founder's review queue", async () => {
		const { setup, hackathonId, ana, ben, anaCard, benCard } =
			await twoParticipants();
		await ben.as.mutation(api.cards.submit, {
			cardId: benCard._id,
			shipped: SHIPPED,
		});
		vi.advanceTimersByTime(60_000);
		await ana.as.mutation(api.cards.submit, {
			cardId: anaCard._id,
			shipped: SHIPPED,
		});

		const queue = await setup.founder.as.query(api.cards.listReviewQueue, {
			hackathonId,
		});
		await setup.founder.as.mutation(api.cards.verify, {
			cardId: benCard._id,
		});
		const after = await setup.founder.as.query(api.cards.listReviewQueue, {
			hackathonId,
		});

		expect(queue.map((card) => card._id)).toEqual([benCard._id, anaCard._id]);
		expect(after.map((card) => card._id)).toEqual([anaCard._id]);
		expect(await activityKinds(setup)).not.toContain("card_verified");
	});

	it("only the Founder sees the review queue", async () => {
		const { hackathonId, ana } = await twoParticipants();

		const queue = ana.as.query(api.cards.listReviewQueue, {
			hackathonId,
		});

		await expect(queue).rejects.toThrow("You're not on this startup");
	});

	it("the Founder sees how far each Participant has got", async () => {
		const { setup, hackathonId, ana, anaCard } = await twoParticipants();
		await ana.as.mutation(api.cards.submit, {
			cardId: anaCard._id,
			shipped: SHIPPED,
		});
		await setup.founder.as.mutation(api.cards.verify, {
			cardId: anaCard._id,
		});

		const rows = await setup.founder.as.query(
			api.applications.listForHackathon,
			{ hackathonId },
		);

		const progressOf = (userId: Id<"users">) =>
			rows.find((row) => row.user._id === userId)?.progress;
		expect(progressOf(ana.userId)).toEqual({
			done: 1,
			inReview: 0,
			moved: 1,
			total: 3,
		});
		expect(rows.filter((row) => row.progress?.done === 0)).toHaveLength(1);
	});

	it("the Founder sees any Participant's Cards", async () => {
		const { setup, hackathonId, ben } = await twoParticipants();

		const cards = await setup.founder.as.query(api.cards.listParticipantBoard, {
			hackathonId,
			participantId: ben.userId,
		});

		expect(cards).toHaveLength(3);
	});
});

describe("deciding", () => {
	async function ended(names = ["Ana", "Ben"]) {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const accepted = await participants(setup, hackathonId, names);
		await startHackathon(setup, hackathonId);
		await endHackathon(setup, hackathonId);
		return { setup, hackathonId, participants: accepted };
	}

	async function walkthrough(setup: Setup, participant: Applicant) {
		await setup.founder.as.mutation(api.applications.shortlist, {
			applicationId: participant.applicationId,
			shortlisted: true,
		});
		await setup.founder.as.mutation(api.applications.requestWalkthrough, {
			applicationId: participant.applicationId,
		});
		await setup.founder.as.mutation(api.applications.markWalkthrough, {
			applicationId: participant.applicationId,
			notes: "Walked us through the signup fix",
		});
	}

	it("the Founder can't work a Participant's Card after the Hackathon closes", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const [card] = await boardOf(hackathonId, ana);
		await ana.as.mutation(api.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});
		await closeHackathon(setup, hackathonId);

		const verify = setup.founder.as.mutation(api.cards.verify, {
			cardId: card._id,
		});

		await expect(verify).rejects.toThrow("This Hackathon has ended");
	});

	/** A Participant with one Card in Review, once the Hackathon has ended. */
	async function endedWithCardInReview() {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const [card] = await boardOf(hackathonId, ana);
		await ana.as.mutation(api.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});
		await endHackathon(setup, hackathonId);
		return { setup, hackathonId, ana, cardId: card._id };
	}

	async function statusOf(setup: Setup, hackathonId: Id<"hackathons">) {
		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		return hackathon?.status;
	}

	it("the deadline tells undecided Participants Not this time, marked as missed", async () => {
		const { setup, hackathonId, participants: accepted } = await ended();
		const [ana, ben] = accepted;
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});

		await closeHackathon(setup, hackathonId);

		const rows = await setup.founder.as.query(
			api.applications.listForHackathon,
			{ hackathonId },
		);
		const applicationOf = (person: Applicant) =>
			rows.find((row) => row.user._id === person.userId)?.application;
		expect(applicationOf(ana)).toMatchObject({
			decision: "not_this_time",
			decisionMissed: false,
		});
		expect(applicationOf(ben)).toMatchObject({
			decision: "not_this_time",
			decisionMissed: true,
		});
	});

	it("a missed decision opens the promise question", async () => {
		const {
			setup,
			hackathonId,
			participants: [ana],
		} = await ended(["Ana"]);
		await closeHackathon(setup, hackathonId);

		await ana.as.mutation(api.applications.keepPromise, {
			applicationId: ana.applicationId,
			kept: false,
		});

		const view = await ana.as.query(api.hackathons.getPublic, { hackathonId });
		expect(view?.myApplication).toMatchObject({
			decision: "not_this_time",
			promiseAnswered: true,
		});
	});

	it("the last decision waits for Cards in Review, and verifying finishes the Hackathon", async () => {
		const { setup, hackathonId, ana, cardId } = await endedWithCardInReview();

		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});
		const waiting = await statusOf(setup, hackathonId);
		await setup.founder.as.mutation(api.cards.verify, { cardId });

		expect(waiting).toBe("deciding");
		expect(await statusOf(setup, hackathonId)).toBe("done");
	});

	it("sending the last Card back finishes a decided Hackathon", async () => {
		const { setup, hackathonId, ana, cardId } = await endedWithCardInReview();
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});

		await setup.founder.as.mutation(api.cards.move, {
			cardId,
			to: "in_progress",
		});

		expect(await statusOf(setup, hackathonId)).toBe("done");
	});

	it("verifying a Card doesn't finish a Hackathon still undecided", async () => {
		const { setup, hackathonId, cardId } = await endedWithCardInReview();

		await setup.founder.as.mutation(api.cards.verify, { cardId });

		expect(await statusOf(setup, hackathonId)).toBe("deciding");
	});

	it("the deadline closes a Hackathon with Cards still in Review, unverified", async () => {
		const { setup, hackathonId, ana, cardId } = await endedWithCardInReview();
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});

		await closeHackathon(setup, hackathonId);

		const card = await setup.t.run(async (ctx) => await ctx.db.get(cardId));
		expect(await statusOf(setup, hackathonId)).toBe("done");
		expect(card).toMatchObject({ status: "review" });
		expect(card?.verifiedAt).toBeUndefined();
	});

	it("the Founder sees how many of a Participant's Cards are in Review", async () => {
		const { setup, hackathonId, ana } = await endedWithCardInReview();

		const rows = await setup.founder.as.query(
			api.applications.listForHackathon,
			{ hackathonId },
		);

		expect(rows.find((row) => row.user._id === ana.userId)?.progress).toEqual({
			done: 0,
			inReview: 1,
			moved: 1,
			total: 3,
		});
	});

	it("decisions wait until the Hackathon ends", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);

		const decide = setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});

		await expect(decide).rejects.toThrow("Decide after the Hackathon ends");
	});

	it("a Walkthrough needs a shortlist", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();

		const mark = setup.founder.as.mutation(api.applications.markWalkthrough, {
			applicationId: ana.applicationId,
		});

		await expect(mark).rejects.toThrow("Shortlist them first");
	});

	it("Hired needs a Walkthrough", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		const hire = () =>
			setup.founder.as.mutation(api.applications.decide, {
				applicationId: ana.applicationId,
				decision: "hired",
				feedback: "Great work",
				terms: "Paid internship, ₹20k a month",
			});

		await expect(hire()).rejects.toThrow("Do the Walkthrough first");
		await walkthrough(setup, ana);
		await hire();

		const invites = await ana.as.query(api.invites.listMine, {});
		expect(invites).toMatchObject([
			{ startupName: "Acme", fromHackathon: true },
		]);
		// Logged when they join, not when the Offer goes out.
		expect(await activityKinds(setup)).not.toContain("participant_hired");
	});

	it("a hire joins with the Hackathon's discipline and title", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended(["Ana"]);
		await walkthrough(setup, ana);
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
			terms: "Paid internship, ₹20k a month",
		});

		const [invite] = await ana.as.query(api.invites.listMine, {});
		await ana.as.mutation(api.invites.accept, { inviteId: invite.inviteId });

		const team = await ana.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});
		expect(team.contributors).toMatchObject([
			{ _id: ana.userId, discipline: "developer", label: "Frontend" },
		]);
	});

	it("a hire already invited as something else takes the Hackathon's role", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended(["Ana"]);
		await walkthrough(setup, ana);
		await setup.founder.as.mutation(api.invites.create, {
			discipline: "sales",
			startupId: setup.startupId,
			email: "ana@example.com",
		});
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
			terms: "Paid internship, ₹20k a month",
		});

		const [invite] = await ana.as.query(api.invites.listMine, {});
		await ana.as.mutation(api.invites.accept, { inviteId: invite.inviteId });

		const team = await ana.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});
		expect(team.contributors).toMatchObject([
			{ discipline: "developer", label: "Frontend" },
		]);
	});

	it("Hired still works when the Participant was already invited", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended(["Ana"]);
		await walkthrough(setup, ana);
		await setup.founder.as.mutation(api.invites.create, {
			discipline: "developer",
			startupId: setup.startupId,
			email: "ana@example.com",
		});

		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
			terms: "Paid internship, ₹20k a month",
		});

		const invites = await ana.as.query(api.invites.listMine, {});
		expect(invites).toHaveLength(1);
		expect(invites).toMatchObject([
			{ startupName: "Acme", fromHackathon: true },
		]);
	});

	it("Hired a Participant already on the team saves the decision without an Invite", async () => {
		const {
			setup,
			hackathonId,
			participants: [ana],
		} = await ended(["Ana"]);
		await walkthrough(setup, ana);
		await setup.founder.as.mutation(api.invites.create, {
			discipline: "developer",
			startupId: setup.startupId,
			email: "ana@example.com",
		});
		const [invite] = await ana.as.query(api.invites.listMine, {});
		await ana.as.mutation(api.invites.accept, {
			inviteId: invite.inviteId,
		});

		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
			terms: "Paid internship, ₹20k a month",
		});

		const list = await setup.founder.as.query(
			api.applications.listForHackathon,
			{ hackathonId },
		);
		expect(list[0].application).toMatchObject({ decision: "hired" });
		// Already on the team, so the Offer is Joined at once.
		expect(list[0].application.joinedAt).not.toBeNull();
		expect(await ana.as.query(api.invites.listMine, {})).toEqual([]);
		expect(await activityKinds(setup)).toContain("participant_hired");
	});

	it("a Participant is decided once", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		const decide = () =>
			setup.founder.as.mutation(api.applications.decide, {
				applicationId: ana.applicationId,
				decision: "not_this_time",
				feedback: "Thanks for the work",
			});

		await decide();

		await expect(decide()).rejects.toThrow("They're already decided");
	});

	it("a decided Participant's ★ and Walkthrough stay as they were", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		await setup.founder.as.mutation(api.applications.shortlist, {
			applicationId: ana.applicationId,
			shortlisted: true,
		});
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});

		const unstar = setup.founder.as.mutation(api.applications.shortlist, {
			applicationId: ana.applicationId,
			shortlisted: false,
		});
		const mark = setup.founder.as.mutation(api.applications.markWalkthrough, {
			applicationId: ana.applicationId,
		});

		await expect(unstar).rejects.toThrow("They're already decided");
		await expect(mark).rejects.toThrow("They're already decided");
	});

	it("the Walkthrough happens once", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		await walkthrough(setup, ana);

		const again = setup.founder.as.mutation(api.applications.markWalkthrough, {
			applicationId: ana.applicationId,
			notes: "Second go",
		});

		await expect(again).rejects.toThrow("The Walkthrough is done");
	});

	it("the ★ stays once they've walked through", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		await walkthrough(setup, ana);

		const unstar = setup.founder.as.mutation(api.applications.shortlist, {
			applicationId: ana.applicationId,
			shortlisted: false,
		});

		await expect(unstar).rejects.toThrow("The Walkthrough is done");
	});

	it("everyone decided finishes the Hackathon", async () => {
		const {
			setup,
			hackathonId,
			participants: [ana, ben],
		} = await ended();
		await walkthrough(setup, ana);

		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
			terms: "Paid internship, ₹20k a month",
		});
		const halfway = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ben.applicationId,
			decision: "not_this_time",
			feedback: "Close one",
		});

		const hackathon = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});
		expect(halfway?.status).toBe("deciding");
		expect(hackathon?.status).toBe("done");
		expect(await activityKinds(setup)).toContain("hackathon_finished");
	});

	it("a Participant answers the promise question once", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended(["Ana"]);
		const answer = () =>
			ana.as.mutation(api.applications.keepPromise, {
				applicationId: ana.applicationId,
				kept: true,
			});

		await expect(answer()).rejects.toThrow("Wait for the decision");
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});
		await answer();

		await expect(answer()).rejects.toThrow("Already answered");
	});

	it("a Participant sees the Founder's note and answers the promise question", async () => {
		const {
			setup,
			hackathonId,
			participants: [ana],
		} = await ended(["Ana"]);
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Close one",
		});

		const before = await ana.as.query(api.hackathons.getPublic, {
			hackathonId,
		});
		await ana.as.mutation(api.applications.keepPromise, {
			applicationId: ana.applicationId,
			kept: true,
		});

		expect(before?.myApplication).toMatchObject({
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Close one",
			promiseAnswered: false,
		});
		const after = await ana.as.query(api.hackathons.getPublic, {
			hackathonId,
		});
		expect(after?.myApplication).toMatchObject({
			applicationId: ana.applicationId,
			feedback: "Close one",
			promiseAnswered: true,
		});
		expect(after?.myApplication).not.toHaveProperty("promiseKept");
	});

	it("the Founder doesn't see a Participant's promise answer", async () => {
		const {
			setup,
			hackathonId,
			participants: [ana],
		} = await ended(["Ana"]);
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});
		await ana.as.mutation(api.applications.keepPromise, {
			applicationId: ana.applicationId,
			kept: false,
		});

		const list = await setup.founder.as.query(
			api.applications.listForHackathon,
			{ hackathonId },
		);

		expect(list[0].application).toMatchObject({ decision: "not_this_time" });
		expect(list[0].application).not.toHaveProperty("promiseKept");
	});

	it("only the Participant answers their promise question", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended(["Ana"]);
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks for the work",
		});

		const answer = setup.founder.as.mutation(api.applications.keepPromise, {
			applicationId: ana.applicationId,
			kept: false,
		});

		await expect(answer).rejects.toThrow("This isn't your application");
	});
});

describe("asking", () => {
	async function asked() {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");
		const threadId = await setup.founder.as.mutation(api.applications.ask, {
			applicationId: ana.applicationId,
		});
		return { setup, hackathonId, ana, threadId };
	}

	it("the Founder asks an Applicant and both can post", async () => {
		const { setup, hackathonId, ana, threadId } = await asked();

		await setup.founder.as.mutation(api.messages.send, {
			threadId,
			body: "What did you build last?",
		});
		await ana.as.mutation(api.messages.send, { threadId, body: "A CLI" });
		const theirs = await ana.as.query(api.threads.list, { hackathonId });

		expect(theirs.map((thread) => thread._id)).toEqual([threadId]);
		const { messages } = await ana.as.query(api.messages.list, { threadId });
		expect(messages.map((message) => message.body)).toEqual([
			"What did you build last?",
			"A CLI",
		]);
	});

	it("asking twice returns the same thread", async () => {
		const { setup, ana, threadId } = await asked();

		const again = await setup.founder.as.mutation(api.applications.ask, {
			applicationId: ana.applicationId,
		});

		expect(again).toBe(threadId);
	});

	it("an Applicant can't open Everyone", async () => {
		const { setup, hackathonId, ana } = await asked();
		const everyone = (
			await setup.founder.as.query(api.threads.list, { hackathonId })
		).find((thread) => thread.kind === "everyone");
		if (!everyone) throw new Error("No Everyone thread");

		await expect(
			ana.as.query(api.messages.list, { threadId: everyone._id }),
		).rejects.toThrow("You can't open this thread");
	});

	it("a declined Applicant reads the thread but can't post", async () => {
		const { setup, ana, threadId } = await asked();
		await setup.founder.as.mutation(api.messages.send, {
			threadId,
			body: "Thanks for applying",
		});
		await setup.founder.as.mutation(api.applications.decline, {
			applicationId: ana.applicationId,
		});

		const { messages } = await ana.as.query(api.messages.list, { threadId });
		expect(messages).toHaveLength(1);
		await expect(
			ana.as.mutation(api.messages.send, { threadId, body: "Why?" }),
		).rejects.toThrow("This conversation is closed");
		await expect(
			setup.founder.as.mutation(api.messages.send, { threadId, body: "Hi" }),
		).rejects.toThrow("This conversation is closed");
	});

	it("accepting keeps the Ask thread", async () => {
		const { setup, hackathonId, ana, threadId } = await asked();

		await setup.founder.as.mutation(api.applications.accept, {
			applicationId: ana.applicationId,
		});

		const threads = await threadsFor(setup, hackathonId);
		expect(threads.map((thread) => thread._id)).toEqual([threadId]);
	});

	it("asking is refused once the Hackathon is done", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		await closeHackathon(setup, hackathonId);

		await expect(
			setup.founder.as.mutation(api.applications.ask, {
				applicationId: ana.applicationId,
			}),
		).rejects.toThrow("This Hackathon has ended");
	});

	it("the 91st Ask is refused", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");
		await setup.t.run(async (ctx) => {
			const hackathon = await ctx.db.get(hackathonId);
			if (!hackathon) throw new Error("No Hackathon");
			for (let i = 0; i < 90; i++) {
				const userId = await ctx.db.insert("users", { name: `Asked${i}` });
				await ctx.db.insert("threads", {
					startupId: hackathon.startupId,
					hackathonId,
					kind: "private",
					participantId: userId,
				});
			}
		});

		await expect(
			setup.founder.as.mutation(api.applications.ask, {
				applicationId: ana.applicationId,
			}),
		).rejects.toThrow("Ask up to 90 people");
	});
});

describe("walkthrough request", () => {
	async function starredBuilder() {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		await setup.founder.as.mutation(api.applications.shortlist, {
			applicationId: ana.applicationId,
			shortlisted: true,
		});
		return { setup, hackathonId, ana };
	}

	it("requesting posts the questions as the Founder in the private thread", async () => {
		const { setup, hackathonId, ana } = await starredBuilder();

		await setup.founder.as.mutation(api.applications.requestWalkthrough, {
			applicationId: ana.applicationId,
		});

		const [thread] = await threadsFor(setup, hackathonId);
		const { messages } = await ana.as.query(api.messages.list, {
			threadId: thread._id,
		});
		expect(messages.at(-1)).toMatchObject({
			body: WALKTHROUGH_QUESTIONS,
			author: { _id: setup.founder.userId },
		});
		const theirs = await ana.as.query(api.threads.list, { hackathonId });
		expect(theirs.find((t) => t.kind === "private")?.unread).toBe(true);
	});

	it("the Builder sees Walkthrough but not the ★", async () => {
		const { setup, hackathonId, ana } = await starredBuilder();
		const before = await ana.as.query(api.hackathons.getPublic, {
			hackathonId,
		});
		await setup.founder.as.mutation(api.applications.requestWalkthrough, {
			applicationId: ana.applicationId,
		});

		const after = await ana.as.query(api.hackathons.getPublic, {
			hackathonId,
		});

		expect(before?.myApplication?.walkthroughRequested).toBe(false);
		expect(after?.myApplication?.walkthroughRequested).toBe(true);
		expect(after?.myApplication).not.toHaveProperty("shortlisted");
		expect(after?.myApplication).not.toHaveProperty("walkthroughNotes");
	});

	it("the Walkthrough is done only after the request", async () => {
		const { setup, ana } = await starredBuilder();

		const mark = setup.founder.as.mutation(api.applications.markWalkthrough, {
			applicationId: ana.applicationId,
		});

		await expect(mark).rejects.toThrow("Request the Walkthrough first");
	});
});

describe("offer", () => {
	async function offered() {
		const setup = await setUpStartup(createTest());
		const {
			hackathonId,
			participants: [ana],
		} = await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);
		return { setup, hackathonId, ana };
	}

	async function applicationOf(setup: Setup, ana: Applicant) {
		const application = await setup.t.run(
			async (ctx) => await ctx.db.get(ana.applicationId),
		);
		if (!application) throw new Error("No application");
		return application;
	}

	async function offerOf(ana: Applicant, hackathonId: Id<"hackathons">) {
		const page = await ana.as.query(api.hackathons.getPublic, { hackathonId });
		return page?.myApplication?.offer;
	}

	async function ended() {
		const setup = await setUpStartup(createTest());
		const {
			hackathonId,
			participants: [ana],
		} = await decidedHackathon(setup, [{ name: "Ana", shortlisted: true }]);
		return { setup, hackathonId, ana };
	}

	it("an Offer needs terms", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		await setup.founder.as.mutation(api.applications.shortlist, {
			applicationId: ana.applicationId,
			shortlisted: true,
		});
		await setup.founder.as.mutation(api.applications.requestWalkthrough, {
			applicationId: ana.applicationId,
		});
		await setup.founder.as.mutation(api.applications.markWalkthrough, {
			applicationId: ana.applicationId,
		});
		await endHackathon(setup, hackathonId);

		const offer = setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
			terms: "  ",
		});

		await expect(offer).rejects.toThrow("Add the Offer terms");
	});

	it("Not this time needs a note", async () => {
		const { setup, ana } = await ended();

		const pass = setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
		});

		await expect(pass).rejects.toThrow("Add a note for them");
	});

	it("an Offer invites with its terms, and isn't Joined yet", async () => {
		const { setup, hackathonId, ana } = await offered();

		const application = await applicationOf(setup, ana);
		expect(application.offerTerms).toBe(OFFER_TERMS);
		expect(application.joinedAt).toBeUndefined();
		expect(await offerOf(ana, hackathonId)).toMatchObject({
			state: "pending",
			terms: OFFER_TERMS,
		});
		expect(await activityKinds(setup)).not.toContain("participant_hired");
	});

	it("accepting the Offer is Joined", async () => {
		const { setup, hackathonId, ana } = await offered();
		const offer = await offerOf(ana, hackathonId);
		if (!offer?.inviteId) throw new Error("No Offer");

		await ana.as.mutation(api.invites.accept, { inviteId: offer.inviteId });

		expect((await applicationOf(setup, ana)).joinedAt).toBeDefined();
		expect(await offerOf(ana, hackathonId)).toMatchObject({ state: "joined" });
		const kinds = await activityKinds(setup);
		expect(kinds.filter((kind) => kind === "participant_hired")).toHaveLength(
			1,
		);
	});

	it("declining the Offer", async () => {
		const { setup, hackathonId, ana } = await offered();
		const offer = await offerOf(ana, hackathonId);
		if (!offer?.inviteId) throw new Error("No Offer");

		await ana.as.mutation(api.invites.decline, { inviteId: offer.inviteId });

		expect((await applicationOf(setup, ana)).offerDeclinedAt).toBeDefined();
		expect(await offerOf(ana, hackathonId)).toMatchObject({
			state: "declined",
			inviteId: null,
		});
	});

	it("an expired Offer can be resent with the same terms", async () => {
		const { setup, hackathonId, ana } = await offered();
		await advancePast(setup.t, 15 * DAY);
		expect(await offerOf(ana, hackathonId)).toMatchObject({ state: "expired" });

		await setup.founder.as.mutation(api.applications.resendOffer, {
			applicationId: ana.applicationId,
		});

		expect(await offerOf(ana, hackathonId)).toMatchObject({
			state: "pending",
			terms: OFFER_TERMS,
		});
	});

	it("resend is refused while open, after Joined and after declined", async () => {
		const resend = (setup: Setup, ana: Applicant) =>
			setup.founder.as.mutation(api.applications.resendOffer, {
				applicationId: ana.applicationId,
			});

		const open = await offered();
		await expect(resend(open.setup, open.ana)).rejects.toThrow(
			"The Offer is still open",
		);

		const joined = await offered();
		const toJoin = await offerOf(joined.ana, joined.hackathonId);
		if (!toJoin?.inviteId) throw new Error("No Offer");
		await joined.ana.as.mutation(api.invites.accept, {
			inviteId: toJoin.inviteId,
		});
		await expect(resend(joined.setup, joined.ana)).rejects.toThrow(
			"They've joined",
		);

		const declined = await offered();
		const toDecline = await offerOf(declined.ana, declined.hackathonId);
		if (!toDecline?.inviteId) throw new Error("No Offer");
		await declined.ana.as.mutation(api.invites.decline, {
			inviteId: toDecline.inviteId,
		});
		await expect(resend(declined.setup, declined.ana)).rejects.toThrow(
			"They declined the Offer",
		);
	});

	it("only Offers can be resent", async () => {
		const setup = await setUpStartup(createTest());
		const {
			participants: [ana],
		} = await decidedHackathon(setup, [
			{ name: "Ana", decision: "not_this_time" },
		]);

		await expect(
			setup.founder.as.mutation(api.applications.resendOffer, {
				applicationId: ana.applicationId,
			}),
		).rejects.toThrow("There's no Offer to resend");
	});
});

describe("offerState", () => {
	it("reads each state", () => {
		expect(offerState({}, false)).toBe("none");
		expect(offerState({ decision: "not_this_time" }, false)).toBe("none");
		expect(offerState({ decision: "hired" }, true)).toBe("pending");
		expect(offerState({ decision: "hired" }, false)).toBe("expired");
		expect(offerState({ decision: "hired", offerDeclinedAt: 1 }, false)).toBe(
			"declined",
		);
		expect(offerState({ decision: "hired", joinedAt: 1 }, false)).toBe(
			"joined",
		);
	});
});

describe("confirmation", () => {
	async function hackathonOf(setup: Setup, hackathonId: Id<"hackathons">) {
		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		if (!hackathon) throw new Error("No Hackathon");
		return hackathon;
	}

	async function statusOf(setup: Setup, ana: Applicant) {
		return await setup.t.run(
			async (ctx) => (await ctx.db.get(ana.applicationId))?.status,
		);
	}

	it("accepting sets confirmBy 48 hours out", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup, {
			startsAt: nextMonday() + 7 * DAY,
		});
		const before = Date.now();
		const [ana] = await participants(setup, hackathonId, ["Ana"], {
			confirm: false,
		});

		const page = await ana.as.query(api.hackathons.getPublic, { hackathonId });
		expect(page?.myApplication).toMatchObject({ confirmed: false });
		expect(page?.myApplication?.confirmBy).toBeGreaterThanOrEqual(
			before + 48 * HOUR,
		);
	});

	it("accepting the day before the start confirms by the start", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const hackathon = await hackathonOf(setup, hackathonId);
		await advancePast(setup.t, hackathon.startsAt - Date.now() - DAY);
		const [ana] = await participants(setup, hackathonId, ["Ana"], {
			confirm: false,
		});

		const page = await ana.as.query(api.hackathons.getPublic, { hackathonId });
		expect(page?.myApplication?.confirmBy).toBe(hackathon.startsAt);
	});

	it("an unconfirmed Builder is released at confirmBy and told", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"], {
			confirm: false,
		});

		await advancePast(setup.t, 49 * HOUR);

		expect(await statusOf(setup, ana)).toBe("declined");
		const kinds = await setup.t.run(async (ctx) =>
			(await ctx.db.query("emails").collect()).map((email) => email.kind),
		);
		expect(kinds).toContain("place_released");
	});

	it("a confirmed Builder stays", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"], {
			confirm: false,
		});

		await ana.as.mutation(api.applications.confirm, {
			applicationId: ana.applicationId,
		});
		await advancePast(setup.t, 49 * HOUR);

		expect(await statusOf(setup, ana)).toBe("participating");
	});

	it("goLive releases the unconfirmed before giving Cards", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"], {
			confirm: false,
		});
		const [bo] = await participants(setup, hackathonId, ["Bo"]);
		// As if the release hadn't run yet: due exactly at the start.
		const { startsAt } = await hackathonOf(setup, hackathonId);
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(ana.applicationId, { confirmBy: startsAt });
		});

		await startHackathon(setup, hackathonId);

		expect(await statusOf(setup, ana)).toBe("declined");
		expect(await boardOf(hackathonId, bo)).not.toHaveLength(0);
	});

	it("a legacy accepted row with no confirmBy stays", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"], {
			confirm: false,
		});
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(ana.applicationId, { confirmBy: undefined });
		});

		await startHackathon(setup, hackathonId);

		expect(await statusOf(setup, ana)).toBe("participating");
	});

	it("confirming late is refused", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"], {
			confirm: false,
		});
		await advancePast(setup.t, 49 * HOUR);

		await expect(
			ana.as.mutation(api.applications.confirm, {
				applicationId: ana.applicationId,
			}),
		).rejects.toThrow("Your place was released");
	});
});

describe("withdrawal", () => {
	it("withdrawing declines you, and the Hackathon finishes on the others' decisions", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana, bo] = await participants(setup, hackathonId, ["Ana", "Bo"]);
		await startHackathon(setup, hackathonId);

		await ana.as.mutation(api.applications.withdraw, {
			applicationId: ana.applicationId,
		});
		await endHackathon(setup, hackathonId);
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: bo.applicationId,
			decision: "not_this_time",
			feedback: "Thanks",
		});

		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		expect(hackathon?.status).toBe("done");
		const application = await setup.t.run(
			async (ctx) => await ctx.db.get(ana.applicationId),
		);
		expect(application).toMatchObject({ status: "declined" });
		expect(application?.withdrawnAt).toBeDefined();
	});

	it("an Applicant can withdraw before the start", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		await ana.as.mutation(api.applications.withdraw, {
			applicationId: ana.applicationId,
		});

		const page = await ana.as.query(api.hackathons.getPublic, { hackathonId });
		expect(page?.myApplication?.status).toBe("declined");
	});

	it("withdraw is refused once decided", async () => {
		const setup = await setUpStartup(createTest());
		const {
			participants: [ana],
		} = await decidedHackathon(setup, [
			{ name: "Ana", decision: "not_this_time" },
		]);

		await expect(
			ana.as.mutation(api.applications.withdraw, {
				applicationId: ana.applicationId,
			}),
		).rejects.toThrow("You're already decided");
	});

	it("only you can withdraw", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		await expect(
			setup.founder.as.mutation(api.applications.withdraw, {
				applicationId: ana.applicationId,
			}),
		).rejects.toThrow("This isn't your application");
	});
});

describe("no-shows", () => {
	async function live() {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		return { setup, hackathonId, ana };
	}
	const remove = (setup: Setup, ana: Applicant) =>
		setup.founder.as.mutation(api.applications.removeNoShow, {
			applicationId: ana.applicationId,
		});

	it("a no-show can be removed from 2 days in, and is told", async () => {
		const { setup, ana } = await live();
		await advancePast(setup.t, 2 * DAY);

		await remove(setup, ana);

		const application = await setup.t.run(
			async (ctx) => await ctx.db.get(ana.applicationId),
		);
		expect(application).toMatchObject({ status: "declined" });
		expect(application?.removedAt).toBeDefined();
		const kinds = await setup.t.run(async (ctx) =>
			(await ctx.db.query("emails").collect()).map((email) => email.kind),
		);
		expect(kinds).toContain("removed");
	});

	it("a Builder who moved a Card can't be removed", async () => {
		const { setup, hackathonId, ana } = await live();
		const [card] = await boardOf(hackathonId, ana);
		await ana.as.mutation(api.cards.move, {
			cardId: card._id,
			to: "in_progress",
		});
		await advancePast(setup.t, 2 * DAY);

		await expect(remove(setup, ana)).rejects.toThrow("They've started");
	});

	it("removal before 2 days is refused", async () => {
		const { setup, ana } = await live();

		await expect(remove(setup, ana)).rejects.toThrow("Give them until");
	});
});
