import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import { onUserSignedIn } from "./people/users.rules";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		Google({
			clientId: process.env.AUTH_GOOGLE_ID,
			clientSecret: process.env.AUTH_GOOGLE_SECRET,
		}),
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
