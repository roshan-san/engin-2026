import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { toNextWeek } from "../rating/rating.setup";
import { addContributor, setUpStartup } from "../startups/startups.setup";
import { createTest } from "../testing/test.setup";
import { signUp } from "../users/users.setup";
import { MAX_WEEK_CONVERSATIONS } from "./rules";

describe("conversations", () => {
	it("anyone on the team adds a line to this week", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await sam.as.mutation(api.conversations.add, {
			startupId: setup.startupId,
			line: "  Priya stopped using it after week one  ",
		});

		const lines = await setup.founder.as.query(api.conversations.listCurrent, {
			startupId: setup.startupId,
		});
		expect(lines).toMatchObject([
			{
				line: "Priya stopped using it after week one",
				authorId: sam.userId,
				author: { _id: sam.userId },
			},
		]);
	});

	it("the newest line comes first", async () => {
		const setup = await setUpStartup(createTest());
		const args = { startupId: setup.startupId };
		await setup.founder.as.mutation(api.conversations.add, {
			...args,
			line: "First",
		});
		await setup.founder.as.mutation(api.conversations.add, {
			...args,
			line: "Second",
		});

		const lines = await setup.founder.as.query(
			api.conversations.listCurrent,
			args,
		);

		expect(lines.map((row) => row.line)).toEqual(["Second", "First"]);
	});

	it("people outside the team can't read or add", async () => {
		const setup = await setUpStartup(createTest());
		const outsider = await signUp(setup.t, "Olu");
		const args = { startupId: setup.startupId };

		await expect(
			outsider.as.query(api.conversations.listCurrent, args),
		).rejects.toThrow("You're not on this startup");
		await expect(
			outsider.as.mutation(api.conversations.add, { ...args, line: "Hi" }),
		).rejects.toThrow("You're not on this startup");
	});

	it("a blank or too long line is refused", async () => {
		const setup = await setUpStartup(createTest());
		const args = { startupId: setup.startupId };

		await expect(
			setup.founder.as.mutation(api.conversations.add, { ...args, line: "  " }),
		).rejects.toThrow();
		await expect(
			setup.founder.as.mutation(api.conversations.add, {
				...args,
				line: "x".repeat(141),
			}),
		).rejects.toThrow("under 140");
	});

	it("the week holds 100 lines", async () => {
		const setup = await setUpStartup(createTest());
		const args = { startupId: setup.startupId };
		for (let n = 0; n < MAX_WEEK_CONVERSATIONS; n++) {
			await setup.founder.as.mutation(api.conversations.add, {
				...args,
				line: `Line ${n}`,
			});
		}

		await expect(
			setup.founder.as.mutation(api.conversations.add, {
				...args,
				line: "One more",
			}),
		).rejects.toThrow("already has 100");
	});

	it("the author or the Founder removes a line", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const ana = await addContributor(setup, "Ana");
		const args = { startupId: setup.startupId };
		await sam.as.mutation(api.conversations.add, { ...args, line: "Mine" });
		await sam.as.mutation(api.conversations.add, { ...args, line: "Also" });
		const [also, mine] = await sam.as.query(
			api.conversations.listCurrent,
			args,
		);

		await expect(
			ana.as.mutation(api.conversations.remove, { conversationId: mine._id }),
		).rejects.toThrow("Only its author or the Founder");
		await sam.as.mutation(api.conversations.remove, {
			conversationId: mine._id,
		});
		await setup.founder.as.mutation(api.conversations.remove, {
			conversationId: also._id,
		});

		expect(await sam.as.query(api.conversations.listCurrent, args)).toEqual([]);
	});

	it("someone off the team can't remove a line", async () => {
		const setup = await setUpStartup(createTest());
		const outsider = await signUp(setup.t, "Olu");
		const args = { startupId: setup.startupId };
		await setup.founder.as.mutation(api.conversations.add, {
			...args,
			line: "Mine",
		});
		const [row] = await setup.founder.as.query(
			api.conversations.listCurrent,
			args,
		);

		await expect(
			outsider.as.mutation(api.conversations.remove, {
				conversationId: row._id,
			}),
		).rejects.toThrow("You're not on this startup");
	});

	it("last week's lines leave the current list", async () => {
		const setup = await setUpStartup(createTest());
		const args = { startupId: setup.startupId };
		await setup.founder.as.mutation(api.conversations.add, {
			...args,
			line: "Old",
		});

		await toNextWeek(setup.t);

		expect(
			await setup.founder.as.query(api.conversations.listCurrent, args),
		).toEqual([]);
	});

	it("lines stay out of the public Record", async () => {
		const setup = await setUpStartup(createTest());
		await setup.founder.as.mutation(api.conversations.add, {
			startupId: setup.startupId,
			line: "A private chat",
		});

		const pages = [
			await setup.t.query(api.startups.getPublic, { slug: setup.slug }),
			await setup.t.query(api.activity.listPublic, { slug: setup.slug }),
			await setup.t.query(api.activity.getSignals, { slug: setup.slug }),
		];

		expect(JSON.stringify(pages)).not.toContain("A private chat");
	});
});
