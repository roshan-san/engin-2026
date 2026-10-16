import type { FunctionArgs } from "convex/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { WEEK_MS, weekOf, weekStart } from "../shared/cycles";
import { givePro } from "./billing.setup";
import type { Setup } from "./startups.setup";

/** The Monday 00:00 IST that starts next week. */
export function nextMonday(): number {
	return weekStart(weekOf(Date.now())) + WEEK_MS;
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
		participantsGet: "Ship real work and meet the team",
		cards: [
			{ title: "Fix signup" },
			{ title: "Add onboarding", notes: "Keep it short" },
			{ title: "Track drop-off" },
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

/** Publishes a draft. A Founder without a plan is given a yearly one first. */
export async function publishedHackathon(
	setup: Setup,
	overrides: Partial<HackathonInput> = {},
): Promise<Id<"hackathons">> {
	const hackathonId = await draftHackathon(setup, overrides);
	const subscription = await setup.t.run(
		async (ctx) =>
			await ctx.db
				.query("subscriptions")
				.withIndex("by_user", (q) => q.eq("userId", setup.founder.userId))
				.first(),
	);
	if (!subscription) {
		await givePro(setup.t, setup.founder);
	}
	await setup.founder.as.mutation(api.hiring.hackathons.publish, {
		hackathonId,
	});
	return hackathonId;
}
