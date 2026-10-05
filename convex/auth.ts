import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import { onUserSignedIn } from "./people/users.rules";

/** Browser tests sign in with a password; only deployments with E2E=1 offer it. */
const e2ePassword =
	process.env.E2E === "1"
		? [
				Password({
					profile: (params) => ({
						email: String(params.email),
						name: String(params.name),
					}),
				}),
			]
		: [];

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		Google({
			clientId: process.env.AUTH_GOOGLE_ID,
			clientSecret: process.env.AUTH_GOOGLE_SECRET,
		}),
		...e2ePassword,
	],
	callbacks: {
		async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
			// The library types ctx against a generic data model; it is this app's.
			await onUserSignedIn(ctx as unknown as MutationCtx, {
				userId,
				existingUserId,
			});
		},
	},
});
