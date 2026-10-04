import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { TestConvex } from "../lib/testing.helpers";

export type Person = Awaited<ReturnType<typeof signUp>>;

export async function signUp(
	t: TestConvex,
	name: string,
	planTier: "free" | "pro" = "free",
) {
	const userId: Id<"users"> = await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				name,
				email: `${name.toLowerCase()}@example.com`,
				username: name.toLowerCase(),
				planTier,
				score: 0,
			}),
	);
	return { userId, as: t.withIdentity({ subject: `${userId}|session` }) };
}

/** The Score shown on someone's public profile. */
export async function scoreOf(t: TestConvex, userId: Id<"users">) {
	const user = await t.run(async (ctx) => await ctx.db.get(userId));
	const profile = await t.query(api.people.users.getByUsername, {
		username: user?.username ?? "",
	});
	return profile?.evidence.score ?? 0;
}
