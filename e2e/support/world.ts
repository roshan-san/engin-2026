import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { seed } from "./convex";
import { type Person, signUp } from "./people";

const DAY = 24 * 60 * 60 * 1000;

export type Startup = Awaited<ReturnType<typeof startupOf>>;

/** A Startup founded by `founder`, with one open Role. */
export async function startupOf(founder: Person) {
	const { startupId, slug } = await founder.api.mutation(
		api.teams.startups.create,
		{ name: `Acme ${founder.username}` },
	);
	const roleId = await founder.api.mutation(api.hiring.roles.create, {
		startupId,
		title: "Engineer",
		type: "full-time",
		skills: ["typescript"],
		description: "Builds the product",
		headcount: 1,
	});
	return { founder, startupId, slug, roleId };
}

/** A fresh Founder with their Startup. */
export async function founderWithStartup(name = "Fay") {
	return await startupOf(await signUp(name));
}

/** A published hackathon, paid with the Founder's signup credit. Starts tomorrow. */
export async function publishedTrial(
	startup: Startup,
	title = `Hackathon ${startup.founder.username}`,
) {
	const startsAt = Date.now() + DAY;
	const trialCycleId = await startup.founder.api.mutation(
		api.hiring.trialCycles.create,
		{
			startupId: startup.startupId,
			roleId: startup.roleId,
			title,
			description: "Ship the onboarding flow",
			maxContributors: 5,
			startsAt,
			endsAt: startsAt + 7 * DAY,
			challenges: [{ title: "Design the flow" }],
		},
	);
	await startup.founder.api.mutation(api.hiring.trialCycles.publish, {
		trialCycleId,
		acceptTerms: true,
	});
	return { trialCycleId, title };
}

/** Applies as `person`; the Founder admits them. */
export async function admit(
	startup: Startup,
	trialCycleId: Id<"trialCycles">,
	person: Person,
) {
	const applicationId = await person.api.mutation(
		api.hiring.applications.applyToTrial,
		{ trialCycleId, acceptTerms: true },
	);
	await startup.founder.api.mutation(api.hiring.applications.decide, {
		applicationId,
		status: "joined",
	});
	return applicationId;
}

/** Starts the hackathon now rather than at its scheduled time. */
export function startNow(trialCycleId: Id<"trialCycles">) {
	seed("startTrial", { trialCycleId });
}

/** Invites `person` to the Startup and has them accept. */
export async function join(
	startup: Startup,
	person: Person,
	role: "founder" | "member" = "member",
) {
	const { inviteId } = await startup.founder.api.mutation(
		api.teams.invitations.create,
		{ startupId: startup.startupId, invitee: person.username, role },
	);
	await person.api.mutation(api.teams.invitations.acceptById, { inviteId });
}
