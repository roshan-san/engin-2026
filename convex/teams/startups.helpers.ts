import { api } from "../_generated/api";
import type { TestConvex } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";

export type Setup = Awaited<ReturnType<typeof setUpStartup>>;

/** A Startup "Acme" with a Founder and one open Role. */
export async function setUpStartup(t: TestConvex, headcount = 1) {
	const founder = await signUp(t, "Founder");
	const { startupId } = await founder.as.mutation(api.teams.startups.create, {
		name: "Acme",
	});
	const roleId = await founder.as.mutation(api.hiring.roles.create, {
		startupId,
		title: "Engineer",
		type: "full-time",
		skills: ["typescript"],
		description: "Build things",
		headcount,
	});
	return { t, founder, startupId, roleId };
}

/** Signs someone up and adds them to the setup's Startup as a Member. */
export async function joinAsMember(setup: Setup, name: string) {
	const member = await signUp(setup.t, name);
	await setup.t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: setup.startupId,
			userId: member.userId,
			role: "member",
		});
	});
	return member;
}
