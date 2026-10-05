import { randomBytes } from "node:crypto";
import type { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { convexClient } from "./convex";

export type Person = {
	name: string;
	email: string;
	username: string;
	tokens: { token: string; refreshToken: string };
	/** Calls the public API as this person, to arrange state without clicking. */
	api: ConvexHttpClient;
};

/** A fresh account, signed up through the E2E-only password provider. */
export async function signUp(name: string): Promise<Person> {
	const suffix = randomBytes(4).toString("hex");
	const username = `${name.toLowerCase()}_${suffix}`;
	const email = `${username}@e2e.test`;

	const client = convexClient();
	const result = await client.action(api.auth.signIn, {
		provider: "password",
		params: { email, name, password: `pw-${suffix}-E2E`, flow: "signUp" },
	});
	if (!result.tokens) {
		throw new Error(`Sign-up for ${email} returned no tokens`);
	}
	client.setAuth(result.tokens.token);
	await client.mutation(api.people.users.updateProfile, { username });

	return { name, email, username, tokens: result.tokens, api: client };
}
