import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { builders } from "../hiring/applications.helpers";
import { publishedHackathon } from "../hiring/hackathons.helpers";
import { MAX_MESSAGE_IMAGES, TEXT } from "../lib/limits";
import { createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.helpers";

async function teamThreadId(setup: Setup) {
	const threads = await setup.founder.as.query(api.chat.threads.list, {
		startupId: setup.startupId,
	});
	return threads[0]._id;
}

async function hackathonThreads(setup: Setup, hackathonId: Id<"hackathons">) {
	return await setup.founder.as.query(api.chat.threads.list, { hackathonId });
}

async function everyoneThreadId(setup: Setup, hackathonId: Id<"hackathons">) {
	const threads = await hackathonThreads(setup, hackathonId);
	return threads.filter((thread) => thread.kind === "everyone")[0]._id;
}

describe("chat", () => {
	it("the team talks in the Team thread", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const casey = await addContributor(setup, "Casey");
		const threadId = await teamThreadId(setup);

		await casey.as.mutation(api.chat.messages.send, {
			threadId,
			body: "  Shipped the fix  ",
		});

		const { messages } = await setup.founder.as.query(api.chat.messages.list, {
			threadId,
		});
		expect(messages.map((message) => message.body)).toEqual([
			"Shipped the fix",
		]);
		expect(messages[0].author._id).toBe(casey.userId);
		const before = await setup.founder.as.query(api.chat.threads.list, {
			startupId: setup.startupId,
		});
		expect(before[0].unread).toBe(true);

		await setup.founder.as.mutation(api.chat.threads.markRead, { threadId });

		const after = await setup.founder.as.query(api.chat.threads.list, {
			startupId: setup.startupId,
		});
		expect(after[0].unread).toBe(false);
	});

	it("your own message is never unread for you", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const threadId = await teamThreadId(setup);

		await setup.founder.as.mutation(api.chat.messages.send, {
			threadId,
			body: "Morning",
		});

		const threads = await setup.founder.as.query(api.chat.threads.list, {
			startupId: setup.startupId,
		});
		expect(threads[0].unread).toBe(false);
		expect(threads[0].lastMessageAt).not.toBeNull();
	});

	it("outsiders can't read the Team thread", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const outsider = await signUp(t, "Olu");
		const threadId = await teamThreadId(setup);

		await expect(
			outsider.as.query(api.chat.messages.list, { threadId }),
		).rejects.toThrow("You can't open this thread");
		await expect(
			outsider.as.mutation(api.chat.messages.send, { threadId, body: "hi" }),
		).rejects.toThrow("You can't open this thread");
		await expect(
			outsider.as.query(api.chat.threads.list, { startupId: setup.startupId }),
		).resolves.toEqual([]);
	});

	it("a Builder sees Everyone and their own private thread only", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await publishedHackathon(setup);
		const [ada, ben] = await builders(setup, hackathonId, ["Ada", "Ben"]);

		const adaThreads = await ada.as.query(api.chat.threads.list, {
			hackathonId,
		});

		expect(adaThreads.map((thread) => thread.kind)).toEqual([
			"everyone",
			"private",
		]);
		expect(adaThreads[1].builder?._id).toBe(ada.userId);
		const founderThreads = await hackathonThreads(setup, hackathonId);
		expect(founderThreads.map((thread) => thread.kind)).toEqual([
			"everyone",
			"private",
			"private",
		]);
		const bensThread = founderThreads.find(
			(thread) => thread.builder?._id === ben.userId,
		);
		if (!bensThread) {
			throw new Error("Ben's thread is missing");
		}
		await expect(
			ada.as.query(api.chat.messages.list, { threadId: bensThread._id }),
		).rejects.toThrow("You can't open this thread");
	});

	it("an applicant who is not a Builder can't open the Hackathon threads", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await publishedHackathon(setup);
		const walkIn = await signUp(t, "Wanda");
		const everyoneId = await everyoneThreadId(setup, hackathonId);

		await expect(
			walkIn.as.query(api.chat.messages.list, { threadId: everyoneId }),
		).rejects.toThrow("You can't open this thread");
		await expect(
			walkIn.as.query(api.chat.threads.list, { hackathonId }),
		).resolves.toEqual([]);
	});

	it("a Builder and the Founder talk in the private thread", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await publishedHackathon(setup);
		const [ada] = await builders(setup, hackathonId, ["Ada"]);
		const threads = await ada.as.query(api.chat.threads.list, { hackathonId });
		const privateId = threads[1]._id;

		await ada.as.mutation(api.chat.messages.send, {
			threadId: privateId,
			body: "Question about the Card",
		});

		const { messages } = await setup.founder.as.query(api.chat.messages.list, {
			threadId: privateId,
		});
		expect(messages.map((message) => message.body)).toEqual([
			"Question about the Card",
		]);
	});

	it("Founder messages can be pinned in Everyone", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await publishedHackathon(setup);
		const [ada] = await builders(setup, hackathonId, ["Ada"]);
		const everyoneId = await everyoneThreadId(setup, hackathonId);
		await setup.founder.as.mutation(api.chat.messages.send, {
			threadId: everyoneId,
			body: "Demo is on Friday",
		});
		const { messages } = await ada.as.query(api.chat.messages.list, {
			threadId: everyoneId,
		});

		await setup.founder.as.mutation(api.chat.messages.pin, {
			messageId: messages[0]._id,
			pinned: true,
		});

		const view = await ada.as.query(api.chat.messages.list, {
			threadId: everyoneId,
		});
		expect(view.pinned.map((message) => message.body)).toEqual([
			"Demo is on Friday",
		]);
		await expect(
			ada.as.mutation(api.chat.messages.pin, {
				messageId: messages[0]._id,
				pinned: false,
			}),
		).rejects.toThrow("Only the Founder can do this");

		await setup.founder.as.mutation(api.chat.messages.pin, {
			messageId: messages[0]._id,
			pinned: false,
		});

		const unpinned = await ada.as.query(api.chat.messages.list, {
			threadId: everyoneId,
		});
		expect(unpinned.pinned).toEqual([]);
	});

	it("only Everyone messages can be pinned", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const threadId = await teamThreadId(setup);
		await setup.founder.as.mutation(api.chat.messages.send, {
			threadId,
			body: "Standup at 10",
		});
		const { messages } = await setup.founder.as.query(api.chat.messages.list, {
			threadId,
		});

		await expect(
			setup.founder.as.mutation(api.chat.messages.pin, {
				messageId: messages[0]._id,
				pinned: true,
			}),
		).rejects.toThrow("Only Everyone messages can be pinned");
	});

	it("an empty message is refused", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const threadId = await teamThreadId(setup);

		await expect(
			setup.founder.as.mutation(api.chat.messages.send, {
				threadId,
				body: "  ",
			}),
		).rejects.toThrow("Write something or add an image");
	});

	it("a message can be an image alone", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const threadId = await teamThreadId(setup);
		const image = await t.run(
			async (ctx) => await ctx.storage.store(new Blob(["png"])),
		);

		await setup.founder.as.mutation(api.chat.messages.send, {
			threadId,
			body: "",
			images: [image],
		});

		const { messages } = await setup.founder.as.query(api.chat.messages.list, {
			threadId,
		});
		expect(messages[0].body).toBe("");
		expect(messages[0].imageUrls).toHaveLength(1);
	});

	it("messages stay within the length and image limits", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const threadId = await teamThreadId(setup);
		const images = await t.run(async (ctx) => {
			const ids = [];
			for (let i = 0; i <= MAX_MESSAGE_IMAGES; i++) {
				ids.push(await ctx.storage.store(new Blob([`png${i}`])));
			}
			return ids;
		});

		await expect(
			setup.founder.as.mutation(api.chat.messages.send, {
				threadId,
				body: "x".repeat(TEXT.message + 1),
			}),
		).rejects.toThrow(`Message must be under ${TEXT.message} characters`);
		await expect(
			setup.founder.as.mutation(api.chat.messages.send, {
				threadId,
				body: "Look",
				images,
			}),
		).rejects.toThrow(`Add up to ${MAX_MESSAGE_IMAGES} images`);
	});

	it("the thread list needs exactly one of startup or Hackathon", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);

		await expect(
			setup.founder.as.query(api.chat.threads.list, {}),
		).rejects.toThrow("Pick a startup or a Hackathon");
	});

	it("signed-in people can get an upload URL", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);

		const url = await setup.founder.as.mutation(
			api.chat.messages.generateUploadUrl,
			{},
		);

		expect(typeof url).toBe("string");
		await expect(
			t.mutation(api.chat.messages.generateUploadUrl, {}),
		).rejects.toThrow("Not authenticated");
	});
});
