// The pure section needs no Convex server imports.
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { shiftWeek, weekOf } from "../cycles/rules";
import { phaseOf } from "../shared/hackathonPhase";
import {
	MAX_USER_APPLICATIONS,
	STARTING_RATING,
	WEEK_COUNT_CAP,
} from "../shared/limits";

export const RATING = {
	weeks: 12,
	base: 800,
	span: 800,
	riseStep: 0.25,
	fallStep: 0.1,
	volumeCap: 5,
	volumeBonus: 0.02,
	volumeBonusCap: 10,
	provisionalWeeks: 4,
	outcomeDays: 365,
	outcomePoints: { hired: 1, finalist: 0.5, built: 0.2 },
	startup: { consistency: 0.6, volume: 0.4 },
	person: { consistency: 0.5, volume: 0.3, outcomes: 0.2 },
} as const;

export type Outcome = "built" | "finalist" | "hired";

export type Parts = {
	consistency: number;
	volume: number;
	active: number;
	weeks: number;
	perWeek: number;
};

/** The finished weeks that count, oldest first: at most 12, none before signup. */
export function countedWeeks(createdAt: number, throughWeek: string): string[] {
	const firstWeek = weekOf(createdAt);
	const weeks: string[] = [];
	for (let week = throughWeek; weeks.length < RATING.weeks; ) {
		if (week < firstWeek) break;
		weeks.unshift(week);
		week = shiftWeek(week, -1);
	}
	return weeks;
}

export function weekVolume(n: number): number {
	const full = Math.min(n, RATING.volumeCap) / RATING.volumeCap;
	const extra = Math.min(
		Math.max(n - RATING.volumeCap, 0),
		RATING.volumeBonusCap,
	);
	return full + RATING.volumeBonus * extra;
}

/** The parts from one verified-Card count per counted week. */
export function buildParts(counts: number[]): Parts {
	const weeks = counts.length;
	if (weeks === 0) {
		return { consistency: 0, volume: 0, active: 0, weeks: 0, perWeek: 0 };
	}
	const active = counts.filter((n) => n > 0).length;
	const volume = counts.reduce((sum, n) => sum + weekVolume(n), 0) / weeks;
	const total = counts.reduce((sum, n) => sum + n, 0);
	return {
		consistency: active / weeks,
		volume,
		active,
		weeks,
		perWeek: Math.round((total / weeks) * 10) / 10,
	};
}

export function outcomeOf(a: {
	status: string;
	decision?: string;
	shortlisted: boolean;
}): Outcome | null {
	if (a.status !== "participating") return null;
	if (a.decision === "hired") return "hired";
	return a.shortlisted ? "finalist" : "built";
}

export function outcomeScore(outcomes: Outcome[]): number {
	const sum = outcomes.reduce((s, o) => s + RATING.outcomePoints[o], 0);
	return Math.min(sum, 1);
}

function toTarget(score: number): number {
	return RATING.base + RATING.span * score;
}

export function startupTarget(parts: Parts): number {
	const w = RATING.startup;
	return toTarget(w.consistency * parts.consistency + w.volume * parts.volume);
}

export function personTarget(parts: Parts, outcomes: number): number {
	const w = RATING.person;
	return toTarget(
		w.consistency * parts.consistency +
			w.volume * parts.volume +
			w.outcomes * outcomes,
	);
}

/** One week's move toward the target: quick to rise, slow to fall. */
export function nextRating(rating: number, target: number): number {
	const step = target > rating ? RATING.riseStep : RATING.fallStep;
	return Math.round(rating + step * (target - rating));
}

export function toPartsView(parts: Parts) {
	return {
		consistency: { active: parts.active, weeks: parts.weeks },
		volume: { perWeek: parts.perWeek },
	};
}

// Loaders and the weekly step.

/** Verified Cards of the Startup per week, Self-verified included. */
export async function loadStartupCounts(
	ctx: QueryCtx,
	startupId: Id<"startups">,
	weeks: string[],
): Promise<number[]> {
	return await Promise.all(
		weeks.map(
			async (week) =>
				(
					await ctx.db
						.query("activity")
						.withIndex("by_startup_and_kind_and_week", (q) =>
							q
								.eq("startupId", startupId)
								.eq("kind", "card_verified")
								.eq("week", week),
						)
						.take(WEEK_COUNT_CAP)
				).length,
		),
	);
}

/** A person's Cards verified by someone else per week, across every Startup. */
export async function loadPersonCounts(
	ctx: QueryCtx,
	userId: Id<"users">,
	weeks: string[],
): Promise<number[]> {
	return await Promise.all(
		weeks.map(
			async (week) =>
				(
					await ctx.db
						.query("activity")
						.withIndex("by_actor_and_kind_and_selfVerified_and_week", (q) =>
							q
								.eq("actorId", userId)
								.eq("kind", "card_verified")
								.eq("selfVerified", false)
								.eq("week", week),
						)
						.take(WEEK_COUNT_CAP)
				).length,
		),
	);
}

/** A person's finished Hackathon outcomes, newest end first. */
export async function loadOutcomes(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<{ outcome: Outcome; hackathon: Doc<"hackathons"> }[]> {
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);
	const now = Date.now();
	const outcomes = await Promise.all(
		applications.map(async (application) => {
			const outcome = outcomeOf(application);
			if (!outcome) {
				return [];
			}
			const hackathon = await ctx.db.get(application.hackathonId);
			if (!hackathon) {
				return [];
			}
			const phase = phaseOf(hackathon, now);
			return phase === "deciding" || phase === "done"
				? [{ outcome, hackathon }]
				: [];
		}),
	);
	return outcomes
		.flat()
		.sort((a, b) => b.hackathon.endsAt - a.hackathon.endsAt);
}

/** Outcomes of Hackathons that ended within the last 365 days. */
export function recentOutcomes(
	outcomes: { outcome: Outcome; hackathon: Doc<"hackathons"> }[],
	now: number,
): Outcome[] {
	const since = now - RATING.outcomeDays * 24 * 3600_000;
	return outcomes
		.filter(({ hackathon }) => hackathon.endsAt >= since)
		.map(({ outcome }) => outcome);
}

async function hasFinishedHackathon(
	ctx: QueryCtx,
	startupId: Id<"startups">,
): Promise<boolean> {
	const done = await ctx.db
		.query("hackathons")
		.withIndex("by_startup_and_status", (q) =>
			q.eq("startupId", startupId).eq("status", "done"),
		)
		.first();
	return done !== null;
}

/** Moves one Startup's Rating for `week`. A rerun of the same week does nothing. */
export async function rateStartup(
	ctx: MutationCtx,
	startup: Doc<"startups">,
	week: string,
): Promise<void> {
	if (startup.ratedThrough !== undefined && startup.ratedThrough >= week) {
		return;
	}
	const weeks = countedWeeks(startup._creationTime, week);
	if (weeks.length === 0) {
		await ctx.db.patch(startup._id, { ratedThrough: week, rhythm: [] });
		return;
	}
	const counts = await loadStartupCounts(ctx, startup._id, weeks);
	const rating = nextRating(startup.rating, startupTarget(buildParts(counts)));
	const ratedWeeks = startup.ratedWeeks + (counts.at(-1) ? 1 : 0);
	const provisional =
		ratedWeeks < RATING.provisionalWeeks &&
		!(await hasFinishedHackathon(ctx, startup._id));

	await ctx.db.patch(startup._id, {
		rating,
		ratingChange: rating - startup.rating,
		ratedWeeks,
		ratedThrough: week,
		provisional,
		rhythm: counts.slice(-RATING.weeks),
	});
}

/** Moves one person's Rating for `week`. A rerun of the same week does nothing. */
export async function rateUser(
	ctx: MutationCtx,
	user: Doc<"users">,
	week: string,
	now: number,
): Promise<void> {
	if (user.ratedThrough !== undefined && user.ratedThrough >= week) {
		return;
	}
	const weeks = countedWeeks(user._creationTime, week);
	if (weeks.length === 0) {
		await ctx.db.patch(user._id, { ratedThrough: week });
		return;
	}
	const [counts, outcomes] = await Promise.all([
		loadPersonCounts(ctx, user._id, weeks),
		loadOutcomes(ctx, user._id),
	]);
	const current = user.rating ?? STARTING_RATING;
	const rating = nextRating(
		current,
		personTarget(
			buildParts(counts),
			outcomeScore(recentOutcomes(outcomes, now)),
		),
	);
	const ratedWeeks = (user.ratedWeeks ?? 0) + (counts.at(-1) ? 1 : 0);

	await ctx.db.patch(user._id, {
		rating,
		ratingChange: rating - current,
		ratedWeeks,
		ratedThrough: week,
		provisional: ratedWeeks < RATING.provisionalWeeks && outcomes.length === 0,
	});
}
