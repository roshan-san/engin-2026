import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_PROFILE_ROWS, STARTING_RATING } from "../shared/limits";
import { shiftWeek, weekOf } from "../shared/cycles";
import { buildUniqueUsername } from "./username";
import {
	buildParts,
	countedWeeks,
	loadOutcomes,
	loadPersonCounts,
	outcomeScore,
	recentOutcomes,
	toPartsView,
} from "./rating";

export type PublicUser = {
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

/** Set weekly by the Rating run (`model/rating.ts`). */
export function isProvisional(user: Doc<"users">): boolean {
	return user.provisional ?? true;
}

/** What anyone may see on a profile page. Never includes email. */
export function toPublicProfile(user: Doc<"users">) {
	return {
		...toPublicUser(user),
		bio: user.bio ?? null,
		discipline: user.discipline ?? null,
		links: {
			linkedinUrl: user.linkedinUrl ?? null,
			portfolioUrl: user.portfolioUrl ?? null,
			githubUrl: user.githubUrl ?? null,
		},
		rating: user.rating ?? STARTING_RATING,
		ratingChange: user.ratingChange ?? 0,
		isProvisional: isProvisional(user),
	};
}

/** The signed-in person's own account: the public profile plus email and Investor Pro. */
export function toOwnProfile(user: Doc<"users">) {
	return {
		...toPublicProfile(user),
		email: user.email ?? null,
		isInvestorPro: user.investorVerifiedAt !== undefined,
	};
}

/**
 * Runs after every sign-in (`convex/auth.ts`). `existingUserId` is null only
 * when the account was just created, which gives it a username and starts its Rating.
 */
export async function onUserSignedIn(
	ctx: MutationCtx,
	args: { userId: Id<"users">; existingUserId: Id<"users"> | null },
): Promise<void> {
	if (args.existingUserId === null) {
		const user = await ctx.db.get(args.userId);
		await ctx.db.patch(args.userId, {
			username: await buildUniqueUsername(ctx, user?.name, user?.email),
			rating: STARTING_RATING,
			ratingChange: 0,
			ratedWeeks: 0,
			provisional: true,
		});
	}
}

/** The profile's Record: Rating parts, finished Hackathons, and Cards verified by others. */
export async function loadProfileRecord(
	ctx: QueryCtx,
	user: Doc<"users">,
	now: number,
) {
	const weeks = countedWeeks(user._creationTime, shiftWeek(weekOf(now), -1));
	const parts = buildParts(await loadPersonCounts(ctx, user._id, weeks));
	const outcomes = await loadOutcomes(ctx, user._id);

	const hackathons = [];
	for (const { outcome, hackathon } of outcomes) {
		const startup = await ctx.db.get(hackathon.startupId);
		if (!startup) continue;
		hackathons.push({
			startup: { name: startup.name, slug: startup.slug },
			job: { role: hackathon.job.role },
			outcome,
			endsAt: hackathon.endsAt,
		});
	}

	const rows = await ctx.db
		.query("activity")
		.withIndex("by_actor_and_kind_and_selfVerified_and_week", (q) =>
			q
				.eq("actorId", user._id)
				.eq("kind", "card_verified")
				.eq("selfVerified", false),
		)
		.order("desc")
		.take(MAX_PROFILE_ROWS);
	const capped = rows.length === MAX_PROFILE_ROWS;
	const counts = new Map<Id<"startups">, number>();
	for (const row of rows) {
		counts.set(row.startupId, (counts.get(row.startupId) ?? 0) + 1);
	}
	const work = [];
	for (const [startupId, count] of counts) {
		const startup = await ctx.db.get(startupId);
		if (!startup) continue;
		work.push({
			startup: { name: startup.name, slug: startup.slug },
			count,
			capped,
		});
	}

	return {
		parts: {
			...toPartsView(parts),
			outcomes:
				Math.round(outcomeScore(recentOutcomes(outcomes, now)) * 100) / 100,
		},
		hackathons,
		work,
	};
}
