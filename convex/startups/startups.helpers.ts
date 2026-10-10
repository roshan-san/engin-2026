import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { TestConvex } from "../lib/testing.helpers";
import { type Person, signUp } from "../people/users.helpers";

export type Setup = {
	t: TestConvex;
	founder: Person;
	startupId: Id<"startups">;
	slug: string;
};

/** Acme, a building-stage SaaS in Bengaluru, owned by its Founder Fay. */
export async function setUpStartup(t: TestConvex): Promise<Setup> {
	const founder = await signUp(t, "Fay");
	const { startupId, slug } = await founder.as.mutation(
		api.startups.startups.create,
		{
			name: "Acme",
			stage: "building",
			category: "saas",
			city: "bengaluru",
		},
	);
	return { t, founder, startupId, slug };
}

/** Signs someone up and puts them on the Startup as a Contributor. */
export async function addContributor(
	setup: Setup,
	name: string,
): Promise<Person> {
	const person = await signUp(setup.t, name);
	await setup.t.run(
		async (ctx) =>
			await ctx.db.insert("contributors", {
				startupId: setup.startupId,
				userId: person.userId,
			}),
	);
	return person;
}
