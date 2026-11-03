import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { loadOutcomes } from "../momentum/model";
import { STARTING_MOMENTUM } from "../momentum/rules";
import { MAX_PROFILE_ROWS } from "./rules";
import { buildUniqueUsername } from "./username";

export type PublicUser = {
	_id: Id<"users">;
	name: string | null;
	username: string | null;
	image: string | null;
	/** Sent with every name, so the client can colour it by Tier. */
	momentum: number;
};

/** Safe to send to any client, including public pages. Never includes email. */
export function toPublicUser(user: Doc<"users">): PublicUser {
	return {
		_id: user._id,
		name: user.name ?? null,
		username: user.username ?? null,
		image: user.image ?? null,
		momentum: user.momentum ?? STARTING_MOMENTUM,
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

/** Set weekly by the Momentum run (`momentum/model.ts`). */
export function isProvisional(user: Doc<"users">): boolean {
	return user.provisional ?? true;
}

/** What anyone, signed out included, sees of a profile: who they are, their Discipline and Momentum. Never includes email. */
export function toPublicProfile(user: Doc<"users">) {
	return {
		...toPublicUser(user),
		discipline: user.discipline ?? null,
		momentumChange: user.momentumChange ?? 0,
		isProvisional: isProvisional(user),
	};
}

/** A profile's bio, shown only to people who are signed in. */
export function toProfileAbout(user: Doc<"users">) {
	return {
		bio: user.bio ?? null,
	};
}

/** The signed-in person's own account: their whole profile plus email. */
export function toOwnProfile(user: Doc<"users">) {
	return {
		...toPublicProfile(user),
		...toProfileAbout(user),
		email: user.email ?? null,
	};
}

/**
 * Runs after every sign-in (`convex/auth.ts`). `existingUserId` is null only
 * when the account was just created, which gives it a username and starts its Momentum.
 */
export async function onUserSignedIn(
	ctx: MutationCtx,
	args: { userId: Id<"users">; existingUserId: Id<"users"> | null },
): Promise<void> {
	if (args.existingUserId === null) {
		const user = await ctx.db.get(args.userId);
		await ctx.db.patch(args.userId, {
			username: await buildUniqueUsername(ctx, user?.name, user?.email),
			momentum: STARTING_MOMENTUM,
			momentumChange: 0,
			scoredWeeks: 0,
			provisional: true,
		});
	}
}

/** The parts behind a person's Momentum, as of the last weekly run; null before their first scored week. */
export async function loadLastParts(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<{ active: number; shipped: number; outcomes: number } | null> {
	const event = await ctx.db
		.query("scoreEvents")
		.withIndex("by_user_and_week", (q) => q.eq("userId", userId))
		.order("desc")
		.first();
	return event
		? {
				active: event.activeWeeks ?? 0,
				shipped: event.shippedWeeks ?? 0,
				outcomes: event.outcomes ?? 0,
			}
		: null;
}

/** The profile's Record: Momentum parts as of the last run, finished Hackathons, and Cards verified by others. */
export async function loadProfileRecord(ctx: QueryCtx, user: Doc<"users">) {
	const [parts, outcomes, rows] = await Promise.all([
		loadLastParts(ctx, user._id),
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
						job: { title: hackathon.job.title },
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
		parts,
		hackathons,
		work,
	};
}
