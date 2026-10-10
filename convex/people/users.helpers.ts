import type { Id } from "../_generated/dataModel";
import type { Client, TestConvex } from "../lib/testing.helpers";
import { onUserSignedIn } from "./users.rules";

export type Person = { userId: Id<"users">; as: Client };

/** An existing account at the starting Rating. Its email is `<name>@example.com`, lowercased. */
export async function signUp(t: TestConvex, name: string): Promise<Person> {
	const userId = await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				name,
				email: `${name.toLowerCase()}@example.com`,
				username: name.toLowerCase(),
				rating: 1000,
				ratingChange: 0,
				ratedWeeks: 0,
			}),
	);
	return { userId, as: t.withIdentity({ subject: `${userId}|session` }) };
}

/** A first sign-in: the account is created without a Rating and `onUserSignedIn` starts it. */
export async function signUpNew(t: TestConvex, name: string): Promise<Person> {
	const userId = await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				name,
				email: `${name.toLowerCase()}@example.com`,
				username: name.toLowerCase(),
			}),
	);
	await t.run(
		async (ctx) => await onUserSignedIn(ctx, { userId, existingUserId: null }),
	);
	return { userId, as: t.withIdentity({ subject: `${userId}|session` }) };
}
