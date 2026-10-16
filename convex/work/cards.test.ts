import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { MAX_BOARD_CARDS } from "../shared/limits";
import { cardOn, SHIPPED } from "../testing/cards.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../testing/startups.setup";
import { createTest } from "../testing/test.setup";
import { signUp } from "../testing/users.setup";

async function boardOf(setup: Setup, who = setup.founder) {
	return await who.as.query(api.work.cards.listBoard, {
		startupId: setup.startupId,
	});
}

describe("board", () => {
	it("a new Card starts in To do with its creator as owner", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await cardOn(setup, sam, "Write welcome emails");

		expect(await boardOf(setup, sam)).toMatchObject([
			{
				title: "Write welcome emails",
				status: "todo",
				notes: "",
				owner: { _id: sam.userId, name: "Sam" },
				changesAsked: false,
				selfVerified: false,
			},
		]);
	});

	it("a Card can be handed to someone on the team, not to an outsider", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const outsider = await signUp(setup.t, "Olly");

		await setup.founder.as.mutation(api.work.cards.create, {
			startupId: setup.startupId,
			title: "Fix pricing page",
			ownerId: sam.userId,
		});

		expect(await boardOf(setup)).toMatchObject([
			{ owner: { _id: sam.userId } },
		]);
		await expect(
			setup.founder.as.mutation(api.work.cards.create, {
				startupId: setup.startupId,
				title: "Other",
				ownerId: outsider.userId,
			}),
		).rejects.toThrow("They're not on this Startup's team");
	});

	it("Cards move between To do and In progress", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");

		await setup.founder.as.mutation(api.work.cards.move, {
			cardId,
			to: "in_progress",
		});

		expect(await boardOf(setup, sam)).toMatchObject([
			{ status: "in_progress", changesAsked: false },
		]);
	});

	it("editing notes records who edited and when", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");

		await setup.founder.as.mutation(api.work.cards.update, {
			cardId,
			notes: "Use the new template",
			title: "Write onboarding emails",
		});

		const [card] = await boardOf(setup);
		expect(card).toMatchObject({
			title: "Write onboarding emails",
			notes: "Use the new template",
			notesEditedBy: { _id: setup.founder.userId },
		});
		expect(card.notesEditedAt).toEqual(expect.any(Number));
	});

	it("a removed Card leaves the Board, but only its owner or the Founder can remove it", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const lee = await addContributor(setup, "Lee");
		const cardId = await cardOn(setup, sam, "Write welcome emails");

		await expect(
			lee.as.mutation(api.work.cards.remove, { cardId }),
		).rejects.toThrow("Only the owner or the Founder can delete this Card");
		await setup.founder.as.mutation(api.work.cards.remove, { cardId });

		expect(await boardOf(setup)).toEqual([]);
	});

	it("verified Cards stay on the Board only for the week they were verified", async () => {
		const setup = await setUpStartup(createTest());
		const old = await cardOn(setup, setup.founder, "Last month's work");
		await cardOn(setup, setup.founder, "Open work");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(old, {
				status: "done",
				shipped: SHIPPED,
				verifiedAt: Date.now() - 30 * 24 * 3600_000,
				verifiedBy: setup.founder.userId,
			});
		});

		expect(await boardOf(setup)).toMatchObject([{ title: "Open work" }]);
	});

	it("a Card verified this week stays on the Board however many Cards were verified before it", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Long-running work");
		await setup.t.run(async (ctx) => {
			for (let i = 0; i <= MAX_BOARD_CARDS; i++) {
				await ctx.db.insert("cards", {
					startupId: setup.startupId,
					ownerId: setup.founder.userId,
					title: `Old work ${i}`,
					notes: "",
					status: "done",
					shipped: SHIPPED,
					verifiedAt: Date.now() - 30 * 24 * 3600_000,
					verifiedBy: setup.founder.userId,
				});
			}
		});

		await setup.founder.as.mutation(api.work.cards.submit, {
			cardId,
			shipped: SHIPPED,
		});

		expect(await boardOf(setup)).toMatchObject([
			{ title: "Long-running work", status: "done" },
		]);
	});

	it("a Card needs a title", async () => {
		const setup = await setUpStartup(createTest());

		await expect(cardOn(setup, setup.founder, "  ")).rejects.toThrow(
			"Title is required",
		);
	});

	it("outsiders can't touch a startup's Cards", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Secret");
		const outsider = await signUp(setup.t, "Olly");

		await expect(boardOf(setup, outsider)).rejects.toThrow(
			"You're not on this startup",
		);
		await expect(
			outsider.as.mutation(api.work.cards.update, { cardId, notes: "hi" }),
		).rejects.toThrow("You're not on this startup");
	});
});

describe("submit and verify", () => {
	it("a Contributor's Card goes to Review with what shipped, and the Founder verifies it", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");

		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });
		expect(await boardOf(setup)).toMatchObject([
			{ status: "review", shipped: SHIPPED, selfVerified: false },
		]);
		await setup.founder.as.mutation(api.work.cards.verify, { cardId });

		expect(await boardOf(setup)).toMatchObject([
			{ status: "done", selfVerified: false },
		]);
		const activity = await setup.t.run(
			async (ctx) => await ctx.db.query("activity").take(10),
		);
		expect(activity).toMatchObject([
			{
				startupId: setup.startupId,
				kind: "card_verified",
				actorId: sam.userId,
				cardId,
				line: "Sent welcome emails",
				selfVerified: false,
			},
		]);
	});

	it("the Founder's own Card is self-verified on submit", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Write welcome emails");

		await setup.founder.as.mutation(api.work.cards.submit, {
			cardId,
			shipped: SHIPPED,
		});

		expect(await boardOf(setup)).toMatchObject([
			{ status: "done", selfVerified: true },
		]);
		const activity = await setup.t.run(
			async (ctx) => await ctx.db.query("activity").take(10),
		);
		expect(activity).toMatchObject([
			{
				kind: "card_verified",
				actorId: setup.founder.userId,
				cardId,
				line: "Sent welcome emails",
				selfVerified: true,
			},
		]);
	});

	it("nothing ships without proof", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Write welcome emails");

		await expect(
			setup.founder.as.mutation(api.work.cards.submit, {
				cardId,
				shipped: { line: "Sent welcome emails", links: [], images: [] },
			}),
		).rejects.toThrow("Add a link or an image");
		await expect(
			setup.founder.as.mutation(api.work.cards.submit, {
				cardId,
				shipped: { ...SHIPPED, line: "  " },
			}),
		).rejects.toThrow("Say what shipped");
		await expect(
			setup.founder.as.mutation(api.work.cards.submit, {
				cardId,
				shipped: { ...SHIPPED, links: ["not a url"] },
			}),
		).rejects.toThrow("must start with http:// or https://");
	});

	it("only the owner submits", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const lee = await addContributor(setup, "Lee");
		const cardId = await cardOn(setup, sam, "Write welcome emails");

		await expect(
			lee.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED }),
		).rejects.toThrow("Only the Card's owner can submit it");
	});

	it("only the Founder verifies", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });

		await expect(
			sam.as.mutation(api.work.cards.verify, { cardId }),
		).rejects.toThrow("Only the Founder can verify a Card");
	});

	it("only a Card in Review can be verified", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Write welcome emails");

		await expect(
			setup.founder.as.mutation(api.work.cards.verify, { cardId }),
		).rejects.toThrow("This Card isn't in Review");
	});
});

describe("send back", () => {
	it("Done can't be reached by moving, and only the Founder sends a Card back", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });

		await expect(
			sam.as.mutation(api.work.cards.move, { cardId, to: "in_progress" }),
		).rejects.toThrow("Only the Founder can send a Card back");
		await expect(
			// @ts-expect-error Done is not a place to move to
			sam.as.mutation(api.work.cards.move, { cardId, to: "done" }),
		).rejects.toThrow();
	});

	it("sending back keeps the Card amber until resubmitted", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });

		await setup.founder.as.mutation(api.work.cards.update, {
			cardId,
			notes: "Add the unsubscribe link",
		});
		await setup.founder.as.mutation(api.work.cards.move, {
			cardId,
			to: "in_progress",
		});

		expect(await boardOf(setup, sam)).toMatchObject([
			{
				status: "in_progress",
				changesAsked: true,
				notesEditedBy: { _id: setup.founder.userId },
			},
		]);
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });
		expect(await boardOf(setup, sam)).toMatchObject([
			{ status: "review", changesAsked: false },
		]);
	});
});

describe("locks", () => {
	it("verified proof is locked, but notes can still change", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });
		await setup.founder.as.mutation(api.work.cards.verify, { cardId });

		await expect(
			sam.as.mutation(api.work.cards.submit, {
				cardId,
				shipped: { ...SHIPPED, line: "Changed my mind" },
			}),
		).rejects.toThrow("This Card is verified");
		await sam.as.mutation(api.work.cards.update, {
			cardId,
			notes: "Follow-up: A/B test the subject",
		});

		expect(await boardOf(setup)).toMatchObject([
			{
				notes: "Follow-up: A/B test the subject",
				shipped: { line: "Sent welcome emails" },
			},
		]);
	});

	it("a verified Card can't be retitled, reassigned, moved or removed", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });
		await setup.founder.as.mutation(api.work.cards.verify, { cardId });

		await expect(
			sam.as.mutation(api.work.cards.update, { cardId, title: "New title" }),
		).rejects.toThrow("This Card is verified");
		await expect(
			setup.founder.as.mutation(api.work.cards.update, {
				cardId,
				ownerId: setup.founder.userId,
			}),
		).rejects.toThrow("This Card is verified");
		await expect(
			setup.founder.as.mutation(api.work.cards.move, { cardId, to: "todo" }),
		).rejects.toThrow("This Card is verified");
		await expect(
			setup.founder.as.mutation(api.work.cards.remove, { cardId }),
		).rejects.toThrow("This Card is verified");
	});

	it("a Card in Review keeps its owner", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const lee = await addContributor(setup, "Lee");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });

		const toFounder = setup.founder.as.mutation(api.work.cards.update, {
			cardId,
			ownerId: setup.founder.userId,
		});
		const toLee = lee.as.mutation(api.work.cards.update, {
			cardId,
			ownerId: lee.userId,
		});

		await expect(toFounder).rejects.toThrow(
			"The owner is fixed once a Card is in Review",
		);
		await expect(toLee).rejects.toThrow(
			"The owner is fixed once a Card is in Review",
		);
		expect(await boardOf(setup)).toMatchObject([
			{ status: "review", owner: { _id: sam.userId } },
		]);
	});

	it("a Card in Review can't be submitted again", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });

		await expect(
			sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED }),
		).rejects.toThrow("This Card is already in Review");
	});

	it("a Hackathon Card stays off the startup Board and away from the team", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const hackathonCard = await setup.t.run(async (ctx) => {
			const hackathonId = await ctx.db.insert("hackathons", {
				startupId: setup.startupId,
				status: "draft",
				job: { role: "frontend", pay: "unpaid", mode: "remote" },
				problem: "Grow signups",
				weeks: 1,
				startsAt: 0,
				endsAt: 0,
				decideBy: 0,
				participantCount: 0,
				applicantCount: 0,
			});
			return await ctx.db.insert("cards", {
				startupId: setup.startupId,
				hackathonId,
				title: "Starter",
				notes: "",
				status: "todo",
			});
		});

		const update = sam.as.mutation(api.work.cards.update, {
			cardId: hackathonCard,
			notes: "hi",
		});

		await expect(update).rejects.toThrow("This Card isn't yours");
		expect(await boardOf(setup)).toEqual([]);
	});
});

describe("card view", () => {
	it("a verified Card says who verified it and when", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, {
			cardId,
			shipped: SHIPPED,
		});

		await setup.founder.as.mutation(api.work.cards.verify, { cardId });

		const [card] = await boardOf(setup);
		expect(card).toMatchObject({
			verifiedBy: { _id: setup.founder.userId },
			shipped: { line: "Sent welcome emails", imageUrls: [] },
		});
		expect(card.verifiedAt).toEqual(expect.any(Number));
		expect(card.submittedAt).toEqual(expect.any(Number));
		expect(card.verifiedAt).toBeGreaterThanOrEqual(card.submittedAt as number);
	});

	it("What shipped images come with their URLs", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		const imageId = await setup.t.run(
			async (ctx) => await ctx.storage.store(new Blob(["x"])),
		);

		await sam.as.mutation(api.work.cards.submit, {
			cardId,
			shipped: { line: "Sent welcome emails", links: [], images: [imageId] },
		});

		const [card] = await boardOf(setup);
		expect(card.shipped?.imageUrls).toHaveLength(1);
		expect(card.shipped?.imageUrls[0]).toEqual(expect.any(String));
	});

	it("an open Card has no submission or verification yet", async () => {
		const setup = await setUpStartup(createTest());
		await cardOn(setup, setup.founder, "Write welcome emails");

		expect(await boardOf(setup)).toMatchObject([
			{ submittedAt: null, verifiedAt: null, verifiedBy: null, shipped: null },
		]);
	});

	it("a Card can be opened by id from its own workspace", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Write welcome emails");

		const card = await setup.founder.as.query(api.work.cards.get, {
			startupId: setup.startupId,
			cardId,
		});

		expect(card).toMatchObject({
			_id: cardId,
			title: "Write welcome emails",
		});
	});

	it("a Card from another Startup isn't shown in this workspace", async () => {
		const setup = await setUpStartup(createTest());
		const { startupId: betaId } = await setup.founder.as.mutation(
			api.startups.startups.create,
			{
				name: "Beta",
				stage: "building",
				category: "saas",
				city: "bengaluru",
			},
		);
		const betaCard = await setup.founder.as.mutation(api.work.cards.create, {
			startupId: betaId,
			title: "Beta work",
		});

		const card = await setup.founder.as.query(api.work.cards.get, {
			startupId: setup.startupId,
			cardId: betaCard,
		});

		expect(card).toBeNull();
	});

	it("a removed Card opens as nothing", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Write welcome emails");
		await setup.founder.as.mutation(api.work.cards.remove, { cardId });

		const card = await setup.founder.as.query(api.work.cards.get, {
			startupId: setup.startupId,
			cardId,
		});

		expect(card).toBeNull();
	});

	it("a link with a broken Card id opens as nothing", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await setup.t.run(
			async (ctx) =>
				await ctx.db.insert("hackathons", {
					startupId: setup.startupId,
					status: "draft",
					job: { role: "frontend", pay: "unpaid", mode: "remote" },
					problem: "Grow signups",
					weeks: 1,
					startsAt: 0,
					endsAt: 0,
					decideBy: 0,
					participantCount: 0,
					applicantCount: 0,
				}),
		);

		const garbage = await setup.founder.as.query(api.work.cards.get, {
			startupId: setup.startupId,
			cardId: "not-a-card",
		});
		const otherTable = await setup.founder.as.query(api.work.cards.get, {
			startupId: setup.startupId,
			cardId: hackathonId,
		});

		expect(garbage).toBeNull();
		expect(otherTable).toBeNull();
	});

	it("someone off the team can't open a Card", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Write welcome emails");
		const outsider = await signUp(setup.t, "Olly");

		const open = outsider.as.query(api.work.cards.get, {
			startupId: setup.startupId,
			cardId,
		});

		await expect(open).rejects.toThrow("You're not on this startup");
	});

	it("a Hackathon Card isn't shown in the Startup workspace", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonCard = await setup.t.run(async (ctx) => {
			const hackathonId = await ctx.db.insert("hackathons", {
				startupId: setup.startupId,
				status: "draft",
				job: { role: "frontend", pay: "unpaid", mode: "remote" },
				problem: "Grow signups",
				weeks: 1,
				startsAt: 0,
				endsAt: 0,
				decideBy: 0,
				participantCount: 0,
				applicantCount: 0,
			});
			return await ctx.db.insert("cards", {
				startupId: setup.startupId,
				hackathonId,
				title: "Starter",
				notes: "",
				status: "todo",
			});
		});

		const card = await setup.founder.as.query(api.work.cards.get, {
			startupId: setup.startupId,
			cardId: hackathonCard,
		});

		expect(card).toBeNull();
	});
});
