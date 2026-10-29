import { describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MAX_APPLICATIONS } from "../shared/limits";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import {
	type Applicant,
	applicant,
	closeHackathon,
	endHackathon,
	participants,
	startHackathon,
} from "../testing/applications.setup";
import { SHIPPED } from "../testing/cards.setup";
import { publishedHackathon } from "../testing/hackathons.setup";
import { createTest } from "../testing/test.setup";

async function boardOf(hackathonId: Id<"hackathons">, participant: Applicant) {
	return await participant.as.query(api.work.cards.listParticipantBoard, {
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

		const again = ana.as.mutation(api.hiring.applications.apply, {
			hackathonId,
			answer: "Me again",
		});
		const hackathon = await setup.t.query(api.hiring.hackathons.getPublic, {
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

		const founder = setup.founder.as.mutation(api.hiring.applications.apply, {
			hackathonId,
			answer: "Hire me",
		});
		const contributor = sam.as.mutation(api.hiring.applications.apply, {
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

		const accept = ben.as.mutation(api.hiring.applications.accept, {
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

		const accept = setup.founder.as.mutation(api.hiring.applications.accept, {
			applicationId: eleventh.applicationId,
		});

		await expect(accept).rejects.toThrow("10 Participants is the limit");
	});

	it("a Participant is accepted once, and an Applicant declined once", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		const ben = await applicant(setup, hackathonId, "Ben");
		await setup.founder.as.mutation(api.hiring.applications.decline, {
			applicationId: ben.applicationId,
		});

		const acceptAgain = setup.founder.as.mutation(
			api.hiring.applications.accept,
			{ applicationId: ana.applicationId },
		);
		const declineAgain = setup.founder.as.mutation(
			api.hiring.applications.decline,
			{ applicationId: ben.applicationId },
		);

		await expect(acceptAgain).rejects.toThrow("They're already a Participant");
		await expect(declineAgain).rejects.toThrow("They're already declined");
	});

	it("declining a Participant before the start frees their place", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const names = Array.from({ length: 10 }, (_, i) => `Participant${i}`);
		const [first] = await participants(setup, hackathonId, names);
		const eleventh = await applicant(setup, hackathonId, "Eleven");

		await setup.founder.as.mutation(api.hiring.applications.decline, {
			applicationId: first.applicationId,
		});
		await setup.founder.as.mutation(api.hiring.applications.accept, {
			applicationId: eleventh.applicationId,
		});
		const list = await setup.founder.as.query(api.hiring.hackathons.list, {
			startupId: setup.startupId,
		});

		expect(list[0].participantCount).toBe(10);
	});

	it("accepting gives the Participant one private Thread, even after a decline", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");
		const accept = () =>
			setup.founder.as.mutation(api.hiring.applications.accept, {
				applicationId: ana.applicationId,
			});

		await accept();
		await setup.founder.as.mutation(api.hiring.applications.decline, {
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

		const hackathon = await setup.t.query(api.hiring.hackathons.getPublic, {
			hackathonId,
		});
		const calView = await cal.as.query(api.hiring.hackathons.getPublic, {
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
		const hackathon = await setup.t.query(api.hiring.hackathons.getPublic, {
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
			api.hiring.applications.listForHackathon,
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

		const accept = setup.founder.as.mutation(api.hiring.applications.accept, {
			applicationId: cal.applicationId,
		});
		const late = applicant(setup, hackathonId, "Dee");

		await expect(accept).rejects.toThrow("Applications are closed");
		await expect(late).rejects.toThrow("Applications are closed");
	});

	it("the Founder sees applicants with their Rating and no email", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const list = await setup.founder.as.query(
			api.hiring.applications.listForHackathon,
			{ hackathonId },
		);
		const asApplicant = ana.as.query(api.hiring.applications.listForHackathon, {
			hackathonId,
		});

		expect(list).toMatchObject([
			{
				application: { _id: ana.applicationId, status: "applied" },
				user: {
					_id: ana.userId,
					name: "Ana",
					rating: 1000,
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

		const view = await setup.founder.as.query(
			api.hiring.applications.getApplicant,
			{ applicationId: ana.applicationId },
		);

		expect(view).toMatchObject({
			application: { status: "applied", answer: "I'm Ana and I fix signups." },
			user: { name: "Ana", username: null, rating: 1000 },
			record: { hackathons: [], work: [] },
		});
	});

	it("only the Founder can see an Applicant", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const forSam = sam.as.query(api.hiring.applications.getApplicant, {
			applicationId: ana.applicationId,
		});
		const forAna = ana.as.query(api.hiring.applications.getApplicant, {
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

		const read = ana.as.query(api.work.cards.listParticipantBoard, {
			hackathonId,
			participantId: ben.userId,
		});
		const submit = ana.as.mutation(api.work.cards.submit, {
			cardId: benCard._id,
			shipped: SHIPPED,
		});
		const move = ana.as.mutation(api.work.cards.move, {
			cardId: benCard._id,
			to: "in_progress",
		});
		const update = ana.as.mutation(api.work.cards.update, {
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

		const read = sam.as.query(api.work.cards.listParticipantBoard, {
			hackathonId,
			participantId: ana.userId,
		});
		const move = sam.as.mutation(api.work.cards.move, {
			cardId: anaCard._id,
			to: "in_progress",
		});

		await expect(read).rejects.toThrow("This Card isn't yours");
		await expect(move).rejects.toThrow("This Card isn't yours");
	});

	it("a Participant moves and submits their own Card but can't remove it", async () => {
		const { ana, anaCard } = await twoParticipants();

		await ana.as.mutation(api.work.cards.move, {
			cardId: anaCard._id,
			to: "in_progress",
		});
		await ana.as.mutation(api.work.cards.submit, {
			cardId: anaCard._id,
			shipped: SHIPPED,
		});
		const remove = ana.as.mutation(api.work.cards.remove, {
			cardId: anaCard._id,
		});

		await expect(remove).rejects.toThrow(
			"Hackathon Cards stay with their Participant",
		);
	});

	it("a Participant can't hand their Card to someone else", async () => {
		const { ana, ben, anaCard } = await twoParticipants();

		const update = ana.as.mutation(api.work.cards.update, {
			cardId: anaCard._id,
			ownerId: ben.userId,
		});

		await expect(update).rejects.toThrow(
			"Hackathon Cards stay with their Participant",
		);
	});

	it("the Founder can't delete a Participant's Card", async () => {
		const { setup, anaCard } = await twoParticipants();

		const remove = setup.founder.as.mutation(api.work.cards.remove, {
			cardId: anaCard._id,
		});

		await expect(remove).rejects.toThrow(
			"Hackathon Cards stay with their Participant",
		);
	});

	it("a declined applicant can't work the Cards", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ana"]);
		const cal = await applicant(setup, hackathonId, "Cal");
		await startHackathon(setup, hackathonId);

		const read = cal.as.query(api.work.cards.listParticipantBoard, {
			hackathonId,
			participantId: cal.userId,
		});

		await expect(read).rejects.toThrow("This Card isn't yours");
	});

	it("Participants stop working when the Hackathon ends", async () => {
		const { setup, hackathonId, ana, anaCard } = await twoParticipants();

		await endHackathon(setup, hackathonId);
		const move = ana.as.mutation(api.work.cards.move, {
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
		const move = ana.as.mutation(api.work.cards.move, {
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
		await ben.as.mutation(api.work.cards.submit, {
			cardId: benCard._id,
			shipped: SHIPPED,
		});
		vi.advanceTimersByTime(60_000);
		await ana.as.mutation(api.work.cards.submit, {
			cardId: anaCard._id,
			shipped: SHIPPED,
		});

		const queue = await setup.founder.as.query(api.work.cards.listReviewQueue, {
			hackathonId,
		});
		await setup.founder.as.mutation(api.work.cards.verify, {
			cardId: benCard._id,
		});
		const after = await setup.founder.as.query(api.work.cards.listReviewQueue, {
			hackathonId,
		});

		expect(queue.map((card) => card._id)).toEqual([benCard._id, anaCard._id]);
		expect(after.map((card) => card._id)).toEqual([anaCard._id]);
		expect(await activityKinds(setup)).not.toContain("card_verified");
	});

	it("only the Founder sees the review queue", async () => {
		const { hackathonId, ana } = await twoParticipants();

		const queue = ana.as.query(api.work.cards.listReviewQueue, {
			hackathonId,
		});

		await expect(queue).rejects.toThrow("You're not on this startup");
	});

	it("the Founder sees how far each Participant has got", async () => {
		const { setup, hackathonId, ana, anaCard } = await twoParticipants();
		await ana.as.mutation(api.work.cards.submit, {
			cardId: anaCard._id,
			shipped: SHIPPED,
		});
		await setup.founder.as.mutation(api.work.cards.verify, {
			cardId: anaCard._id,
		});

		const rows = await setup.founder.as.query(
			api.hiring.applications.listForHackathon,
			{ hackathonId },
		);

		const progressOf = (userId: Id<"users">) =>
			rows.find((row) => row.user._id === userId)?.progress;
		expect(progressOf(ana.userId)).toEqual({ done: 1, total: 3 });
		expect(rows.filter((row) => row.progress?.done === 0)).toHaveLength(1);
	});

	it("the Founder sees any Participant's Cards", async () => {
		const { setup, hackathonId, ben } = await twoParticipants();

		const cards = await setup.founder.as.query(
			api.work.cards.listParticipantBoard,
			{ hackathonId, participantId: ben.userId },
		);

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
		await setup.founder.as.mutation(api.hiring.applications.shortlist, {
			applicationId: participant.applicationId,
			shortlisted: true,
		});
		await setup.founder.as.mutation(api.hiring.applications.markWalkthrough, {
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
		await ana.as.mutation(api.work.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});
		await closeHackathon(setup, hackathonId);

		const verify = setup.founder.as.mutation(api.work.cards.verify, {
			cardId: card._id,
		});

		await expect(verify).rejects.toThrow("This Hackathon has ended");
	});

	it("decisions wait until the Hackathon ends", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);

		const decide = setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
		});

		await expect(decide).rejects.toThrow("Decide after the Hackathon ends");
	});

	it("a Walkthrough needs a shortlist", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();

		const mark = setup.founder.as.mutation(
			api.hiring.applications.markWalkthrough,
			{ applicationId: ana.applicationId },
		);

		await expect(mark).rejects.toThrow("Shortlist them first");
	});

	it("Hired needs a Walkthrough", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		const hire = () =>
			setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId: ana.applicationId,
				decision: "hired",
				feedback: "Great work",
			});

		await expect(hire()).rejects.toThrow("Do the Walkthrough first");
		await walkthrough(setup, ana);
		await hire();

		const invites = await ana.as.query(api.invites.listMine, {});
		expect(invites).toMatchObject([
			{ startupName: "Acme", fromHackathon: true },
		]);
		expect(await activityKinds(setup)).toContain("participant_hired");
	});

	it("Hired still works when the Participant was already invited", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended(["Ana"]);
		await walkthrough(setup, ana);
		await setup.founder.as.mutation(api.invites.create, {
			startupId: setup.startupId,
			email: "ana@example.com",
		});

		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
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
			startupId: setup.startupId,
			email: "ana@example.com",
		});
		const [invite] = await ana.as.query(api.invites.listMine, {});
		await ana.as.mutation(api.invites.accept, {
			inviteId: invite.inviteId,
		});

		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
		});

		const list = await setup.founder.as.query(
			api.hiring.applications.listForHackathon,
			{ hackathonId },
		);
		expect(list[0].application).toMatchObject({ decision: "hired" });
		expect(await ana.as.query(api.invites.listMine, {})).toEqual([]);
		expect(await activityKinds(setup)).toContain("participant_hired");
	});

	it("a Participant is decided once", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		const decide = () =>
			setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId: ana.applicationId,
				decision: "not_this_time",
			});

		await decide();

		await expect(decide()).rejects.toThrow("They're already decided");
	});

	it("a decided Participant's ★ and Walkthrough stay as they were", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		await setup.founder.as.mutation(api.hiring.applications.shortlist, {
			applicationId: ana.applicationId,
			shortlisted: true,
		});
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
		});

		const unstar = setup.founder.as.mutation(
			api.hiring.applications.shortlist,
			{ applicationId: ana.applicationId, shortlisted: false },
		);
		const mark = setup.founder.as.mutation(
			api.hiring.applications.markWalkthrough,
			{ applicationId: ana.applicationId },
		);

		await expect(unstar).rejects.toThrow("They're already decided");
		await expect(mark).rejects.toThrow("They're already decided");
	});

	it("the Walkthrough happens once", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		await walkthrough(setup, ana);

		const again = setup.founder.as.mutation(
			api.hiring.applications.markWalkthrough,
			{ applicationId: ana.applicationId, notes: "Second go" },
		);

		await expect(again).rejects.toThrow("The Walkthrough is done");
	});

	it("the ★ stays once they've walked through", async () => {
		const {
			setup,
			participants: [ana],
		} = await ended();
		await walkthrough(setup, ana);

		const unstar = setup.founder.as.mutation(
			api.hiring.applications.shortlist,
			{ applicationId: ana.applicationId, shortlisted: false },
		);

		await expect(unstar).rejects.toThrow("The Walkthrough is done");
	});

	it("everyone decided finishes the Hackathon", async () => {
		const {
			setup,
			hackathonId,
			participants: [ana, ben],
		} = await ended();
		await walkthrough(setup, ana);

		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
		});
		const halfway = await setup.t.query(api.hiring.hackathons.getPublic, {
			hackathonId,
		});
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ben.applicationId,
			decision: "not_this_time",
			feedback: "Close one",
		});

		const hackathon = await setup.t.query(api.hiring.hackathons.getPublic, {
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
			ana.as.mutation(api.hiring.applications.keepPromise, {
				applicationId: ana.applicationId,
				kept: true,
			});

		await expect(answer()).rejects.toThrow("Wait for the decision");
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
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
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Close one",
		});

		const before = await ana.as.query(api.hiring.hackathons.getPublic, {
			hackathonId,
		});
		await ana.as.mutation(api.hiring.applications.keepPromise, {
			applicationId: ana.applicationId,
			kept: true,
		});

		expect(before?.myApplication).toMatchObject({
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Close one",
			promiseAnswered: false,
		});
		const after = await ana.as.query(api.hiring.hackathons.getPublic, {
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
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
		});
		await ana.as.mutation(api.hiring.applications.keepPromise, {
			applicationId: ana.applicationId,
			kept: false,
		});

		const list = await setup.founder.as.query(
			api.hiring.applications.listForHackathon,
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
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
		});

		const answer = setup.founder.as.mutation(
			api.hiring.applications.keepPromise,
			{ applicationId: ana.applicationId, kept: false },
		);

		await expect(answer).rejects.toThrow("This isn't your application");
	});
});
