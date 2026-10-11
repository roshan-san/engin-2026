import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { advancePast, HOUR } from "../lib/testing.helpers";
import { type Person, signUp } from "../people/users.helpers";
import type { Setup } from "../startups/startups.helpers";
import { publishedHackathon } from "./hackathons.helpers";

export type Applicant = Person & { applicationId: Id<"applications"> };

/** Signs someone up and has them apply to the Hackathon. */
export async function applicant(
	setup: Setup,
	hackathonId: Id<"hackathons">,
	name: string,
): Promise<Applicant> {
	const person = await signUp(setup.t, name);
	const applicationId = await person.as.mutation(
		api.hiring.applications.apply,
		{
			hackathonId,
			answer: `I'm ${name} and I fix signups.`,
		},
	);
	return { ...person, applicationId };
}

/** Applicants the Founder accepted before the start. */
export async function builders(
	setup: Setup,
	hackathonId: Id<"hackathons">,
	names: string[],
): Promise<Applicant[]> {
	const accepted: Applicant[] = [];
	for (const name of names) {
		const person = await applicant(setup, hackathonId, name);
		await setup.founder.as.mutation(api.hiring.applications.accept, {
			applicationId: person.applicationId,
		});
		accepted.push(person);
	}
	return accepted;
}

/** Moves time just past the start and lets the Builders' Cards be copied. Stays in `building`. */
export async function startHackathon(
	setup: Setup,
	hackathonId: Id<"hackathons">,
) {
	const hackathon = await setup.t.run(
		async (ctx) => await ctx.db.get(hackathonId),
	);
	if (!hackathon) {
		throw new Error("Hackathon not found");
	}
	await advancePast(setup.t, hackathon.startsAt - Date.now() + HOUR);
	await advancePast(setup.t, 0);
}

/** Moves time just past the end, so the Hackathon is `deciding`. */
export async function endHackathon(
	setup: Setup,
	hackathonId: Id<"hackathons">,
) {
	const hackathon = await setup.t.run(
		async (ctx) => await ctx.db.get(hackathonId),
	);
	if (!hackathon) {
		throw new Error("Hackathon not found");
	}
	await advancePast(setup.t, hackathon.endsAt - Date.now() + HOUR);
}

type BuilderPlan = {
	name: string;
	decision?: "hired" | "not_this_time";
	/** Hired Builders are always shortlisted and walked through. */
	shortlisted?: boolean;
};

/** A Frontend Hackathon run to its end, each Builder decided as planned or left undecided. */
export async function decidedHackathon(
	setup: Setup,
	plans: BuilderPlan[],
): Promise<{ hackathonId: Id<"hackathons">; builders: Applicant[] }> {
	const hackathonId = await publishedHackathon(setup);
	const accepted = await builders(
		setup,
		hackathonId,
		plans.map((plan) => plan.name),
	);
	await startHackathon(setup, hackathonId);
	for (const [i, plan] of plans.entries()) {
		if (plan.decision === "hired" || plan.shortlisted) {
			await setup.founder.as.mutation(api.hiring.applications.shortlist, {
				applicationId: accepted[i].applicationId,
				shortlisted: true,
			});
		}
		if (plan.decision === "hired") {
			await setup.founder.as.mutation(api.hiring.applications.markWalkthrough, {
				applicationId: accepted[i].applicationId,
			});
		}
	}
	await endHackathon(setup, hackathonId);
	for (const [i, plan] of plans.entries()) {
		if (plan.decision) {
			await setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId: accepted[i].applicationId,
				decision: plan.decision,
			});
		}
	}
	return { hackathonId, builders: accepted };
}
