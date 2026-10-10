import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { advancePast, createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { addContributor, setUpStartup } from "../startups/startups.helpers";
import { cardOn } from "../work/cards.helpers";

const INTERVAL = 10_000;

describe("presence", () => {
	it("someone on the team shows as online after a heartbeat", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await addContributor(setup, "Sam");

		await sam.as.mutation(api.chat.presence.heartbeat, {
			startupId: setup.startupId,
			sessionId: "sam-tab",
			interval: INTERVAL,
		});

		const online = await setup.founder.as.query(api.chat.presence.list, {
			startupId: setup.startupId,
		});
		expect(online).toMatchObject([{ user: { _id: sam.userId } }]);
	});

	it("an outsider can't announce themselves on a Startup", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const outsider = await signUp(t, "Olly");

		await expect(
			outsider.as.mutation(api.chat.presence.heartbeat, {
				startupId: setup.startupId,
				sessionId: "olly-tab",
				interval: INTERVAL,
			}),
		).rejects.toThrow("You're not on this startup");
	});

	it("an outsider can't see who's online", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const outsider = await signUp(t, "Olly");

		await expect(
			outsider.as.query(api.chat.presence.list, {
				startupId: setup.startupId,
			}),
		).rejects.toThrow("You're not on this startup");
	});

	it("online people show the Card they're working on", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await addContributor(setup, "Sam");
		const lee = await addContributor(setup, "Lee");
		const older = await cardOn(setup, sam, "Pricing page");
		const newer = await cardOn(setup, sam, "Onboarding emails");
		await cardOn(setup, lee, "Write docs");
		for (const cardId of [older, newer]) {
			await sam.as.mutation(api.work.cards.move, {
				cardId,
				to: "in_progress",
			});
		}
		for (const [person, sessionId] of [
			[sam, "sam-tab"],
			[lee, "lee-tab"],
		] as const) {
			await person.as.mutation(api.chat.presence.heartbeat, {
				startupId: setup.startupId,
				sessionId,
				interval: INTERVAL,
			});
		}

		const online = await setup.founder.as.query(api.chat.presence.list, {
			startupId: setup.startupId,
		});

		const workingOn = (userId: typeof sam.userId) =>
			online.find((entry) => entry.user._id === userId)?.workingOn;
		expect(workingOn(sam.userId)).toMatchObject({
			cardId: newer,
			title: "Onboarding emails",
		});
		expect(workingOn(lee.userId)).toBeNull();
	});

	it("a disconnected person drops off the list", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await addContributor(setup, "Sam");
		const { sessionToken } = await sam.as.mutation(
			api.chat.presence.heartbeat,
			{ startupId: setup.startupId, sessionId: "sam-tab", interval: INTERVAL },
		);

		await sam.as.mutation(api.chat.presence.disconnect, { sessionToken });
		await advancePast(t, 2000);

		const online = await setup.founder.as.query(api.chat.presence.list, {
			startupId: setup.startupId,
		});
		expect(online).toEqual([]);
	});
});
