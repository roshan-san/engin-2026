import { vi } from "vitest";
import { api, internal } from "../_generated/api";
import { nextMonday } from "./hackathons.setup";
import { advancePast, HOUR, type TestConvex } from "./test.setup";
import type { Person } from "./users.setup";
import type { Setup } from "./startups.setup";
import { cardOn, SHIPPED } from "./cards.setup";

/** n Cards owned by `person`, submitted and verified by the Founder (Self-verified when `person` is the Founder). */
export async function verifyCards(
	setup: Setup,
	person: Person,
	n: number,
): Promise<void> {
	for (let i = 0; i < n; i++) {
		const cardId = await cardOn(setup, person, `Card ${i + 1}`);
		await person.as.mutation(api.work.cards.submit, {
			cardId,
			shipped: { ...SHIPPED, line: `Shipped ${i + 1}` },
		});
		if (person.userId !== setup.founder.userId) {
			await setup.founder.as.mutation(api.work.cards.verify, { cardId });
		}
	}
}

/** Moves time just past next Monday 00:00 IST, so this week is finished. */
export async function toNextWeek(t: TestConvex): Promise<void> {
	await advancePast(t, nextMonday() - Date.now() + HOUR);
}

/** The weekly cron: rates every Startup, then every person, for the week that just ended. */
export async function runRating(t: TestConvex): Promise<void> {
	await t.mutation(internal.work.rating.rateStartups, {});
	await t.finishAllScheduledFunctions(vi.runAllTimers);
}
