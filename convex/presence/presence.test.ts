import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { cardOn } from "../testing/cards.setup";
import { addContributor, setUpStartup } from "../testing/startups.setup";
import { advancePast, createTest } from "../testing/test.setup";
import { signUp } from "../testing/users.setup";

const INTERVAL = 10_000;

describe("presence", () => {
	it("someone on the team shows as online after a heartbeat", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await addContributor(setup, "Sam");

		await sam.as.mutation(api.presence.heartbeat, {
			startupId: setup.startupId,
			sessionId: "sam-tab",
			interval: INTERVAL,
		});

		const online = await setup.founder.as.query(api.presence.list, {
			startupId: setup.startupId,
		});
		expect(online).toMatchObject([{ user: { _id: sam.userId } }]);
	});

	it("an outsider can't announce themselves on a Startup", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const outsider = await signUp(t, "Olly");

		await expect(
			outsider.as.mutation(api.presence.heartbeat, {
				startupId: setup.startupId,
				sessionId: "olly-tab",
				interval: INTERVAL,
			}),
		).rejects.toThrow("You're not on this startup");
		const online = await setup.founder.as.query(api.presence.list, {
			startupId: setup.startupId,
		});
		expect(online).toEqual([]);
	});

	it("an outsider can't see who's online", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const outsider = await signUp(t, "Olly");

		await expect(
			outsider.as.query(api.presence.list, {
				startupId: setup.startupId,
			}),
		).rejects.toThrow("You're not on this startup");
	});

	it("a heartbeat with an unreasonable interval is refused", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);

		for (const interval of [0, -5, 999, 60_001, Number.POSITIVE_INFINITY]) {
			await expect(
				setup.founder.as.mutation(api.presence.heartbeat, {
					startupId: setup.startupId,
					sessionId: "fay-tab",
					interval,
				}),
			).rejects.toThrow("Heartbeat interval is out of range");
		}
	});

	it("a heartbeat with an over-long session id is refused", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);

		await expect(
			setup.founder.as.mutation(api.presence.heartbeat, {
				startupId: setup.startupId,
				sessionId: "x".repeat(65),
				interval: INTERVAL,
			}),
		).rejects.toThrow("Session must be under 64 characters");
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
			await person.as.mutation(api.presence.heartbeat, {
				startupId: setup.startupId,
				sessionId,
				interval: INTERVAL,
			});
		}

		const online = await setup.founder.as.query(api.presence.list, {
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
		const { sessionToken } = await sam.as.mutation(api.presence.heartbeat, {
			startupId: setup.startupId,
			sessionId: "sam-tab",
			interval: INTERVAL,
		});

		await sam.as.mutation(api.presence.disconnect, { sessionToken });
		await advancePast(t, 2000);

		const online = await setup.founder.as.query(api.presence.list, {
			startupId: setup.startupId,
		});
		expect(online).toEqual([]);
	});
});
