import { vi } from "vitest";
import { api, internal } from "../_generated/api";
import { cardOn, SHIPPED } from "../cards/cards.setup";
import { nextMonday } from "../hackathons/hackathons.setup";
import type { Setup } from "../startups/startups.setup";
import { advancePast, HOUR, type TestConvex } from "../testing/test.setup";
import type { Person } from "../users/users.setup";

/** n Cards owned by `person`, submitted and verified by the Founder (Self-verified when `person` is the Founder), 11 minutes after they were made so they earn credit. */
export async function verifyCards(
	setup: Setup,
	person: Person,
	n: number,
): Promise<void> {
	await approveCards(setup, person, n, 11 * 60_000);
}

/** As `verifyCards`, approved the moment they're made, so they earn nothing. */
export async function verifyCardsNow(
	setup: Setup,
	person: Person,
	n: number,
): Promise<void> {
	await approveCards(setup, person, n, 0);
}

async function approveCards(
	setup: Setup,
	person: Person,
	n: number,
	wait: number,
): Promise<void> {
	const cardIds = [];
	for (let i = 0; i < n; i++) {
		cardIds.push(await cardOn(setup, person, `Card ${i + 1}`));
	}
	if (wait > 0) {
		await advancePast(setup.t, wait);
	}
	for (const [i, cardId] of cardIds.entries()) {
		await person.as.mutation(api.cards.submit, {
			cardId,
			shipped: { ...SHIPPED, line: `Shipped ${i + 1}` },
		});
		if (person.userId !== setup.founder.userId) {
			await setup.founder.as.mutation(api.cards.verify, { cardId });
		}
	}
}

/** Moves time just past next Monday 00:00 IST, so this week is finished. */
export async function toNextWeek(t: TestConvex): Promise<void> {
	await advancePast(t, nextMonday() - Date.now() + HOUR);
}

/** The weekly cron: scores every Startup, then every person, for the week that just ended. */
export async function runMomentum(t: TestConvex): Promise<void> {
	await t.mutation(internal.momentum.scoreStartups, {});
	await t.finishAllScheduledFunctions(vi.runAllTimers);
}
