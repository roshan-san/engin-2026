// The pure section needs no Convex server imports.
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_USER_APPLICATIONS } from "../applications/rules";
import { shiftWeek, weekOf } from "../cycles/rules";
import { MAX_HACKATHON_CARDS, phaseOf } from "../hackathons/rules";
import { STARTING_MOMENTUM, WEEK_COUNT_CAP } from "./rules";

export const MOMENTUM = {
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
	for (let week = throughWeek; weeks.length < MOMENTUM.weeks; ) {
		if (week < firstWeek) break;
		weeks.unshift(week);
		week = shiftWeek(week, -1);
	}
	return weeks;
}

export function weekVolume(n: number): number {
	const full = Math.min(n, MOMENTUM.volumeCap) / MOMENTUM.volumeCap;
	const extra = Math.min(
		Math.max(n - MOMENTUM.volumeCap, 0),
		MOMENTUM.volumeBonusCap,
	);
	return full + MOMENTUM.volumeBonus * extra;
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

/** Hired always counts; Finalist and Built need a Done Card to show for it. */
export function outcomeOf(
	a: {
		status: string;
		decision?: string;
		shortlisted: boolean;
	},
	hasDoneCard: boolean,
): Outcome | null {
	if (a.status !== "participating") return null;
	if (a.decision === "hired") return "hired";
	if (!hasDoneCard) return null;
	return a.shortlisted ? "finalist" : "built";
}

export function outcomeScore(outcomes: Outcome[]): number {
	const sum = outcomes.reduce((s, o) => s + MOMENTUM.outcomePoints[o], 0);
	return Math.min(sum, 1);
}

function toTarget(score: number): number {
	return MOMENTUM.base + MOMENTUM.span * score;
}

export function startupTarget(parts: Parts): number {
	const w = MOMENTUM.startup;
	return toTarget(w.consistency * parts.consistency + w.volume * parts.volume);
}

export function personTarget(parts: Parts, outcomes: number): number {
	const w = MOMENTUM.person;
	return toTarget(
		w.consistency * parts.consistency +
			w.volume * parts.volume +
			w.outcomes * outcomes,
	);
}

/** One week's move toward the target: quick to rise, slow to fall. */
export function nextMomentum(momentum: number, target: number): number {
	const step = target > momentum ? MOMENTUM.riseStep : MOMENTUM.fallStep;
	return Math.round(momentum + step * (target - momentum));
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

async function hasDoneCard(
	ctx: QueryCtx,
	application: Doc<"applications">,
): Promise<boolean> {
	const cards = await ctx.db
		.query("cards")
		.withIndex("by_hackathon_and_owner", (q) =>
			q
				.eq("hackathonId", application.hackathonId)
				.eq("ownerId", application.userId),
		)
		.take(MAX_HACKATHON_CARDS);
	return cards.some((card) => card.status === "done");
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
			if (application.status !== "participating") {
				return [];
			}
			const hackathon = await ctx.db.get(application.hackathonId);
			if (!hackathon) {
				return [];
			}
			const phase = phaseOf(hackathon, now);
			if (phase !== "deciding" && phase !== "done") {
				return [];
			}
			// Hired counts without a Done Card, so only read Cards when they can matter.
			const outcome = outcomeOf(
				application,
				application.decision !== "hired" &&
					(await hasDoneCard(ctx, application)),
			);
			return outcome ? [{ outcome, hackathon }] : [];
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
	const since = now - MOMENTUM.outcomeDays * 24 * 3600_000;
	return outcomes
		.filter(({ hackathon }) => hackathon.endsAt >= since)
		.map(({ outcome }) => outcome);
}

async function hasFinishedHackathon(
	ctx: QueryCtx,
	startupId: Id<"startups">,
): Promise<boolean> {
	const done = ctx.db
		.query("hackathons")
		.withIndex("by_startup_and_status", (q) =>
			q.eq("startupId", startupId).eq("status", "done"),
		);
	for await (const hackathon of done) {
		// One nobody joined ended without anyone building, so it proves nothing.
		const participant = await ctx.db
			.query("applications")
			.withIndex("by_hackathon_and_status", (q) =>
				q.eq("hackathonId", hackathon._id).eq("status", "participating"),
			)
			.first();
		if (participant) {
			return true;
		}
	}
	return false;
}

/** Moves one Startup's Momentum for `week`. A rerun of the same week does nothing. */
export async function scoreStartup(
	ctx: MutationCtx,
	startup: Doc<"startups">,
	week: string,
): Promise<void> {
	if (startup.scoredThrough !== undefined && startup.scoredThrough >= week) {
		return;
	}
	const weeks = countedWeeks(startup._creationTime, week);
	if (weeks.length === 0) {
		await ctx.db.patch(startup._id, { scoredThrough: week, rhythm: [] });
		return;
	}
	const counts = await loadStartupCounts(ctx, startup._id, weeks);
	const momentum = nextMomentum(
		startup.momentum,
		startupTarget(buildParts(counts)),
	);
	const scoredWeeks = startup.scoredWeeks + (counts.at(-1) ? 1 : 0);
	const provisional =
		scoredWeeks < MOMENTUM.provisionalWeeks &&
		!(await hasFinishedHackathon(ctx, startup._id));

	await ctx.db.patch(startup._id, {
		momentum,
		momentumChange: momentum - startup.momentum,
		scoredWeeks,
		scoredThrough: week,
		provisional,
		rhythm: counts.slice(-MOMENTUM.weeks),
	});
}

/** Moves one person's Momentum for `week`. A rerun of the same week does nothing. */
export async function scoreUser(
	ctx: MutationCtx,
	user: Doc<"users">,
	week: string,
	now: number,
): Promise<void> {
	if (user.scoredThrough !== undefined && user.scoredThrough >= week) {
		return;
	}
	const weeks = countedWeeks(user._creationTime, week);
	if (weeks.length === 0) {
		await ctx.db.patch(user._id, { scoredThrough: week });
		return;
	}
	const [counts, outcomes] = await Promise.all([
		loadPersonCounts(ctx, user._id, weeks),
		loadOutcomes(ctx, user._id),
	]);
	const current = user.momentum ?? STARTING_MOMENTUM;
	const momentum = nextMomentum(
		current,
		personTarget(
			buildParts(counts),
			outcomeScore(recentOutcomes(outcomes, now)),
		),
	);
	const scoredWeeks = (user.scoredWeeks ?? 0) + (counts.at(-1) ? 1 : 0);

	await ctx.db.patch(user._id, {
		momentum,
		momentumChange: momentum - current,
		scoredWeeks,
		scoredThrough: week,
		provisional:
			scoredWeeks < MOMENTUM.provisionalWeeks && outcomes.length === 0,
	});
}
