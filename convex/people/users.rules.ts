import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { STARTING_RATING } from "../lib/limits";

type PublicUser = {
	_id: Id<"users">;
	name: string | null;
	username: string | null;
	image: string | null;
};

/** Safe to send to any client, including public pages. Never includes email. */
export function toPublicUser(user: Doc<"users">): PublicUser {
	return {
		_id: user._id,
		name: user.name ?? null,
		username: user.username ?? null,
		image: user.image ?? null,
	};
}

export async function loadPublicUser(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users"> | undefined,
): Promise<PublicUser | null> {
	if (!userId) {
		return null;
	}
	const user = await ctx.db.get(userId);
	return user ? toPublicUser(user) : null;
}

/**
 * Runs after every sign-in (`convex/auth.ts`). `existingUserId` is null only
 * when the account was just created, which starts its Rating.
 */
export async function onUserSignedIn(
	ctx: MutationCtx,
	args: { userId: Id<"users">; existingUserId: Id<"users"> | null },
): Promise<void> {
	if (args.existingUserId === null) {
		await ctx.db.patch(args.userId, {
			rating: STARTING_RATING,
			ratingChange: 0,
			ratedWeeks: 0,
		});
	}
}
