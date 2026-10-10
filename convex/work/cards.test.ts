import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.helpers";
import { cardOn, SHIPPED } from "./cards.helpers";

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
		).rejects.toThrow("They're not on this startup");
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
		).rejects.toThrow("Only the owner or the Founder can remove this Card");
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
		).rejects.toThrow("Add a link or image");
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
		).rejects.toThrow("Only the Founder can do this");
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

	it("a Card in Review can't be submitted again", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");
		await sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED });

		await expect(
			sam.as.mutation(api.work.cards.submit, { cardId, shipped: SHIPPED }),
		).rejects.toThrow("This Card is in Review");
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
				builderCount: 0,
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
