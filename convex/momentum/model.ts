// The pure section needs no Convex server imports.
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_USER_APPLICATIONS } from "../applications/rules";
import { shiftWeek, weekOf } from "../cycles/rules";
import { MAX_HACKATHON_CARDS, phaseOf } from "../hackathons/rules";
import { loadCredits } from "./credit";
import { STARTING_MOMENTUM, type Trust, WEEK_COUNT_CAP } from "./rules";
import { loadTrustInputs, NO_PROGRESS, nextTrust } from "./trust";

export const MOMENTUM = {
	weeks: 12,
	/** 860 so a steady self-approving Founder (credit 0.25) holds the starting 1000. */
	base: 860,
	span: 800,
	riseStep: 0.25,
	fallStep: 0.1,
	provisionalWeeks: 4,
	/** Below this many active weeks, the missing ones count as `neutralCredit`. */
	minWeeks: 4,
	/** The self-approved credit: a filler week neither lifts nor lowers. */
	neutralCredit: 0.25,
	outcomeDays: 365,
	outcomePoints: { joined: 1, finalist: 0.5, built: 0.2 },
	person: { consistency: 0.7, outcomes: 0.3 },
} as const;

/** Team rows read per startup in one weekly step. */
const MAX_TEAM = 200;

export type Outcome = "built" | "finalist" | "joined";

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

/**
 * A person's Consistency over the counted weeks: the summed credit of their active
 * weeks over at least 4, the missing ones filled at the neutral 0.25. A week's credit
 * is its best single approval, so one approver can give full credit.
 */
export function consistencyOf(weeks: { active: boolean; credit: number }[]): {
	consistency: number;
	active: number;
	shipped: number;
} {
	const active = weeks.filter((week) => week.active);
	const shipped = active.filter((week) => week.credit > 0).length;
	const sum = active.reduce((total, week) => total + week.credit, 0);
	const fillers = Math.max(MOMENTUM.minWeeks - active.length, 0);
	return {
		consistency:
			(sum + fillers * MOMENTUM.neutralCredit) /
			Math.max(active.length, MOMENTUM.minWeeks),
		active: active.length,
		shipped,
	};
}

/** Joined (an Offer they accepted) always counts; Finalist and Built need a Done Card to show for it. */
export function outcomeOf(
	a: {
		status: string;
		decision?: string;
		shortlisted: boolean;
		joinedAt?: number;
	},
	hasDoneCard: boolean,
): Outcome | null {
	if (a.status !== "participating") return null;
	if (a.decision === "hired" && a.joinedAt !== undefined) return "joined";
	if (!hasDoneCard) return null;
	return a.shortlisted ? "finalist" : "built";
}

export function outcomeScore(outcomes: Outcome[]): number {
	const sum = outcomes.reduce((s, o) => s + MOMENTUM.outcomePoints[o], 0);
	return Math.min(sum, 1);
}

/** Rounded to cents, so 0.7 × 0.25 lands on 1000 and not 999.99. */
function toTarget(score: number): number {
	return Math.round((MOMENTUM.base + MOMENTUM.span * score) * 100) / 100;
}

export function personTarget(consistency: number, outcomes: number): number {
	const w = MOMENTUM.person;
	return toTarget(w.consistency * consistency + w.outcomes * outcomes);
}

/** One week's move toward the target: quick to rise, slow to fall. */
export function nextMomentum(momentum: number, target: number): number {
	const step = target > momentum ? MOMENTUM.riseStep : MOMENTUM.fallStep;
	return Math.round(momentum + step * (target - momentum));
}

const TRUST_LEVELS: Trust[] = ["low", "mid", "high"];

/**
 * A startup's Momentum and Trust: its team's, weighted by the credit each earned there.
 * Trust averages the levels (Low 0, Mid 1, High 2), rounded down. No credit: 1000 at Low.
 */
export function teamAverage(
	members: { weight: number; momentum: number; trust: Trust }[],
): { momentum: number; trust: Trust; credit: number } {
	const credit = members.reduce((sum, m) => sum + m.weight, 0);
	if (credit === 0) {
		return { momentum: STARTING_MOMENTUM, trust: "low", credit: 0 };
	}
	const weighted = (value: (m: (typeof members)[number]) => number) =>
		members.reduce((sum, m) => sum + m.weight * value(m), 0) / credit;
	// The small nudge keeps a float like 0.9999999 from rounding a level down.
	const level = Math.floor(
		weighted((m) => TRUST_LEVELS.indexOf(m.trust)) + 1e-9,
	);
	return {
		momentum: Math.round(weighted((m) => m.momentum)),
		trust: TRUST_LEVELS[level],
		credit: Math.round(credit * 100) / 100,
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
			// Joined counts without a Done Card, so only read Cards when they can matter.
			const outcome = outcomeOf(
				application,
				application.joinedAt === undefined &&
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

/** The Founder and current Contributors. Hackathon Builders aren't team. */
async function loadTeamIds(
	ctx: QueryCtx,
	startup: Doc<"startups">,
): Promise<Id<"users">[]> {
	const contributors = await ctx.db
		.query("contributors")
		.withIndex("by_startup_and_user", (q) => q.eq("startupId", startup._id))
		.take(MAX_TEAM);
	return [startup.founderId, ...contributors.map((row) => row.userId)];
}

/**
 * Sets one Startup's Momentum and Trust for `week` from its team, weighting each
 * person by the approval credit they earned there over the last 12 weeks, and
 * records the step in `scoreEvents`. Run after people. A rerun of the same week does nothing.
 */
export async function scoreStartup(
	ctx: MutationCtx,
	startup: Doc<"startups">,
	week: string,
): Promise<void> {
	if (startup.scoredThrough !== undefined && startup.scoredThrough >= week) {
		return;
	}
	const weeks = countedWeeks(startup._creationTime, week);
	const fromWeek = shiftWeek(week, 1 - MOMENTUM.weeks);
	const [counts, members] = await Promise.all([
		loadStartupCounts(ctx, startup._id, weeks),
		loadTeamIds(ctx, startup).then((ids) =>
			Promise.all(
				ids.map(async (userId) => {
					const [user, credits] = await Promise.all([
						ctx.db.get(userId),
						loadCredits(ctx, userId, { fromWeek, startupId: startup._id }),
					]);
					return {
						weight: credits
							.filter((row) => row.week <= week && !row.hackathonId)
							.reduce((sum, row) => sum + row.credit, 0),
						momentum: user?.momentum ?? STARTING_MOMENTUM,
						trust: user?.trust ?? "low",
					};
				}),
			),
		),
	]);
	const { momentum, trust, credit } = teamAverage(members);
	const scoredWeeks = startup.scoredWeeks + (counts.at(-1) ? 1 : 0);
	const provisional =
		scoredWeeks < MOMENTUM.provisionalWeeks &&
		!(await hasFinishedHackathon(ctx, startup._id));

	await ctx.db.insert("scoreEvents", {
		startupId: startup._id,
		week,
		momentum,
		trust,
		credit,
	});
	await ctx.db.patch(startup._id, {
		momentum,
		momentumChange: momentum - startup.momentum,
		trust,
		scoredWeeks,
		scoredThrough: week,
		provisional,
		rhythm: counts.slice(-MOMENTUM.weeks),
	});
}

/**
 * Moves one person's Momentum for `week` and records the step in `scoreEvents`.
 * Momentum moves only in a week they were active, so a break never lowers it.
 * A rerun of the same week does nothing.
 */
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
	const [credits, activeRows, outcomes, trustInputs] = await Promise.all([
		loadCredits(ctx, user._id, { fromWeek: weeks[0] }),
		ctx.db
			.query("activeWeeks")
			.withIndex("by_user_and_week", (q) =>
				q.eq("userId", user._id).gte("week", weeks[0]).lte("week", week),
			)
			.take(MOMENTUM.weeks),
		loadOutcomes(ctx, user._id),
		loadTrustInputs(ctx, user),
	]);
	const active = new Set(activeRows.map((row) => row.week));
	const best = new Map<string, number>();
	for (const row of credits) {
		best.set(row.week, Math.max(best.get(row.week) ?? 0, row.credit));
	}
	const weekRows = weeks.map((w) => ({
		active: active.has(w),
		credit: best.get(w) ?? 0,
	}));
	const parts = consistencyOf(weekRows);
	const outcomeValue = outcomeScore(recentOutcomes(outcomes, now));
	const thisWeek = weekRows[weekRows.length - 1];

	const current = user.momentum ?? STARTING_MOMENTUM;
	const momentum = thisWeek.active
		? nextMomentum(current, personTarget(parts.consistency, outcomeValue))
		: current;
	const scoredWeeks = (user.scoredWeeks ?? 0) + (thisWeek.credit > 0 ? 1 : 0);
	const trust = nextTrust({
		current: user.trust ?? "low",
		held: user.trustHeld === true,
		since: user.trustSince,
		countsFrom: user.trustCountsFrom,
		week,
		lastOutsideWeek: trustInputs.lastOutsideWeek,
		progress: trustInputs.progress,
	});
	// A fall restarts the count, so the progress shown restarts too.
	const fell = trust.countsFrom !== user.trustCountsFrom;

	await ctx.db.insert("scoreEvents", {
		userId: user._id,
		week,
		momentum,
		trust: trust.trust,
		activeWeeks: parts.active,
		shippedWeeks: parts.shipped,
		consistency: parts.consistency,
		outcomes: Math.round(outcomeValue * 100) / 100,
		credit: thisWeek.credit,
	});
	await ctx.db.patch(user._id, {
		momentum,
		momentumChange: momentum - current,
		scoredWeeks,
		scoredThrough: week,
		provisional:
			scoredWeeks < MOMENTUM.provisionalWeeks && outcomes.length === 0,
		trust: trust.trust,
		trustSince: trust.since,
		trustCountsFrom: trust.countsFrom,
		trustProgress: fell ? NO_PROGRESS : trustInputs.progress,
	});
}
