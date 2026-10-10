import type { FunctionArgs } from "convex/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { DAY } from "../lib/testing.helpers";
import type { Setup } from "../startups/startups.helpers";
import { weekOf, weekStart } from "../work/cycles.rules";

/** The Monday 00:00 IST that starts next week. */
export function nextMonday(): number {
	return weekStart(weekOf(Date.now())) + 7 * DAY;
}

type HackathonInput = Omit<
	FunctionArgs<typeof api.hiring.hackathons.create>,
	"startupId"
>;

/** A valid Hackathon draft: a one-week Frontend job starting next Monday. */
export function hackathonInput(
	overrides: Partial<HackathonInput> = {},
): HackathonInput {
	return {
		job: { role: "frontend", pay: "6_9l", mode: "remote" },
		problem: "Our signup drops people before they finish.",
		weeks: 1,
		startsAt: nextMonday(),
		buildersGet: "Ship real work and meet the team",
		cards: [
			{ title: "Fix signup" },
			{ title: "Add onboarding", notes: "Keep it short" },
		],
		...overrides,
	};
}

export async function draftHackathon(
	setup: Setup,
	overrides: Partial<HackathonInput> = {},
): Promise<Id<"hackathons">> {
	return await setup.founder.as.mutation(api.hiring.hackathons.create, {
		startupId: setup.startupId,
		...hackathonInput(overrides),
	});
}

export async function publishedHackathon(
	setup: Setup,
	overrides: Partial<HackathonInput> = {},
): Promise<Id<"hackathons">> {
	const hackathonId = await draftHackathon(setup, overrides);
	await setup.founder.as.mutation(api.hiring.hackathons.publish, {
		hackathonId,
	});
	return hackathonId;
}
