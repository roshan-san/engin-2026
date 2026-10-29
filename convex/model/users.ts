import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	buildParts,
	countedWeeks,
	loadOutcomes,
	loadPersonCounts,
	outcomeScore,
	recentOutcomes,
	toPartsView,
} from "../rating/model";
import { shiftWeek, weekOf } from "../shared/cycles";
import { MAX_PROFILE_ROWS, STARTING_RATING } from "../shared/limits";
import { buildUniqueUsername } from "./username";

export type PublicUser = {
	_id: Id<"users">;
	name: string | null;
	username: string | null;
	image: string | null;
	/** Sent with every name, so the client can colour it by Tier. */
	rating: number;
};

/** Safe to send to any client, including public pages. Never includes email. */
export function toPublicUser(user: Doc<"users">): PublicUser {
	return {
		_id: user._id,
		name: user.name ?? null,
		username: user.username ?? null,
		image: user.image ?? null,
		rating: user.rating ?? STARTING_RATING,
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

/** A verified investor, who sees a Startup's full public Activity. */
export function isInvestorPro(user: Doc<"users"> | null): boolean {
	return user?.investorVerifiedAt !== undefined;
}

/** Set weekly by the Rating run (`rating/model.ts`). */
export function isProvisional(user: Doc<"users">): boolean {
	return user.provisional ?? true;
}

/** What anyone, signed out included, sees of a profile: who they are, their Discipline and Rating. Never includes email. */
export function toPublicProfile(user: Doc<"users">) {
	return {
		...toPublicUser(user),
		discipline: user.discipline ?? null,
		ratingChange: user.ratingChange ?? 0,
		isProvisional: isProvisional(user),
	};
}

/** A profile's bio, shown only to people who are signed in. */
export function toProfileAbout(user: Doc<"users">) {
	return {
		bio: user.bio ?? null,
	};
}

/** The signed-in person's own account: their whole profile plus email and Investor Pro. */
export function toOwnProfile(user: Doc<"users">) {
	return {
		...toPublicProfile(user),
		...toProfileAbout(user),
		email: user.email ?? null,
		isInvestorPro: isInvestorPro(user),
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
	const [weekCounts, outcomes, rows] = await Promise.all([
		loadPersonCounts(ctx, user._id, weeks),
		loadOutcomes(ctx, user._id),
		ctx.db
			.query("activity")
			.withIndex("by_actor_and_kind_and_selfVerified_and_week", (q) =>
				q
					.eq("actorId", user._id)
					.eq("kind", "card_verified")
					.eq("selfVerified", false),
			)
			.order("desc")
			.take(MAX_PROFILE_ROWS),
	]);
	const parts = buildParts(weekCounts);
	const capped = rows.length === MAX_PROFILE_ROWS;
	const counts = new Map<Id<"startups">, number>();
	for (const row of rows) {
		counts.set(row.startupId, (counts.get(row.startupId) ?? 0) + 1);
	}

	// Each Startup once, for both lists.
	const startupIds = new Set([
		...outcomes.map(({ hackathon }) => hackathon.startupId),
		...counts.keys(),
	]);
	const startups = new Map(
		await Promise.all(
			[...startupIds].map(
				async (startupId) => [startupId, await ctx.db.get(startupId)] as const,
			),
		),
	);
	const nameOf = (startupId: Id<"startups">) => {
		const startup = startups.get(startupId);
		return startup ? { name: startup.name, slug: startup.slug } : null;
	};

	const hackathons = outcomes.flatMap(({ outcome, hackathon }) => {
		const startup = nameOf(hackathon.startupId);
		return startup
			? [
					{
						startup,
						job: { role: hackathon.job.role },
						outcome,
						endsAt: hackathon.endsAt,
					},
				]
			: [];
	});
	const work = [...counts].flatMap(([startupId, count]) => {
		const startup = nameOf(startupId);
		return startup ? [{ startup, count, capped }] : [];
	});

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
