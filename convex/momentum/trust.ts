import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_USER_APPLICATIONS } from "../applications/rules";
import { WEEK_MS, weekOf, weekStart } from "../cycles/rules";
import {
	isPaid,
	MAX_HACKATHON_CARDS,
	MAX_PARTICIPANTS,
} from "../hackathons/rules";
import { MAX_USER_STARTUPS } from "../startups/rules";
import { type Credit, loadCredits } from "./credit";
import { TRUST_RULES, type Trust } from "./rules";

/** How far a person is along each Trust rule. */
export type TrustProgress = {
	/** Different weeks someone else approved their work (for Mid). */
	weeks: number;
	/** Different weeks Mid or High people approved their work (for High). */
	highWeeks: number;
	/** Unrelated startups among those approvals, up to 2 (for High). */
	highStartups: 0 | 1 | 2;
	/** Finished a paid Hackathon whose promise was kept (for Mid). */
	hackathon: boolean;
};

export const NO_PROGRESS: TrustProgress = {
	weeks: 0,
	highWeeks: 0,
	highStartups: 0,
	hackathon: false,
};

const LEVELS: Trust[] = ["low", "mid", "high"];

function weeksBetween(from: string, to: string): number {
	return Math.round((weekStart(to) - weekStart(from)) / WEEK_MS);
}

/** The level the rules give for this progress. */
export function earnedTrust(progress: TrustProgress): Trust {
	if (
		progress.highWeeks >= TRUST_RULES.highWeeks &&
		progress.highStartups >= TRUST_RULES.highStartups
	) {
		return "high";
	}
	if (progress.weeks >= TRUST_RULES.midWeeks || progress.hackathon) {
		return "mid";
	}
	return "low";
}

/**
 * Trust after the run for `week`. A flag holds it. It rises to what the rules give,
 * and drops one level once 12 weeks pass with no outside approval since the later of
 * the last one and the last change; a drop restarts the count from that week.
 */
export function nextTrust(input: {
	current: Trust;
	held: boolean;
	since?: string;
	countsFrom?: string;
	week: string;
	lastOutsideWeek?: string;
	progress: TrustProgress;
}): { trust: Trust; since?: string; countsFrom?: string } {
	const { current, since, countsFrom, week } = input;
	const kept = { trust: current, since, countsFrom };
	if (input.held) {
		return kept;
	}
	const earned = earnedTrust(input.progress);
	if (LEVELS.indexOf(earned) > LEVELS.indexOf(current)) {
		return { trust: earned, since: week, countsFrom };
	}
	const anchors = [input.lastOutsideWeek, since].filter(
		(w): w is string => w !== undefined,
	);
	if (current === "low" || anchors.length === 0) {
		return kept;
	}
	const latest = anchors.reduce((a, b) => (a > b ? a : b));
	if (weeksBetween(latest, week) >= TRUST_RULES.fallWeeks) {
		return {
			trust: LEVELS[LEVELS.indexOf(current) - 1],
			since: week,
			countsFrom: week,
		};
	}
	return kept;
}

/** Everyone who has ever been on the startup's team: its Founder, current Contributors and anyone who ever joined. */
async function loadTeamHistory(
	ctx: QueryCtx,
	startupId: Id<"startups">,
): Promise<Set<Id<"users">>> {
	const startup = await ctx.db.get(startupId);
	const [contributors, joined] = await Promise.all([
		ctx.db
			.query("contributors")
			.withIndex("by_startup_and_user", (q) => q.eq("startupId", startupId))
			.take(MAX_TEAM_READ),
		ctx.db
			.query("activity")
			.withIndex("by_startup_and_kind_and_week", (q) =>
				q.eq("startupId", startupId).eq("kind", "contributor_joined"),
			)
			.take(MAX_TEAM_READ),
	]);
	const team = new Set<Id<"users">>();
	if (startup) team.add(startup.founderId);
	for (const row of contributors) team.add(row.userId);
	for (const row of joined) if (row.actorId) team.add(row.actorId);
	return team;
}

const MAX_TEAM_READ = 500;
/** Startups compared pairwise when looking for 2 unrelated ones. */
const MAX_STARTUPS_COMPARED = 10;

/** Two startups are unrelated when no one, the person being scored aside, has ever been on both teams. */
export async function areUnrelated(
	ctx: QueryCtx,
	a: Id<"startups">,
	b: Id<"startups">,
	personId: Id<"users">,
): Promise<boolean> {
	const [teamA, teamB] = await Promise.all([
		loadTeamHistory(ctx, a),
		loadTeamHistory(ctx, b),
	]);
	for (const userId of teamA) {
		if (userId !== personId && teamB.has(userId)) return false;
	}
	return true;
}

async function countUnrelated(
	ctx: QueryCtx,
	startupIds: Id<"startups">[],
	personId: Id<"users">,
): Promise<0 | 1 | 2> {
	if (startupIds.length === 0) return 0;
	const ids = startupIds.slice(0, MAX_STARTUPS_COMPARED);
	for (let i = 0; i < ids.length; i++) {
		for (let j = i + 1; j < ids.length; j++) {
			if (await areUnrelated(ctx, ids[i], ids[j], personId)) return 2;
		}
	}
	return 1;
}

/** At least one Builder answered kept, and more answered kept than not. */
async function promiseKept(
	ctx: QueryCtx,
	hackathonId: Id<"hackathons">,
): Promise<boolean> {
	const builders = await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathonId).eq("status", "participating"),
		)
		.take(MAX_PARTICIPANTS);
	const kept = builders.filter((a) => a.promiseKept === true).length;
	const broken = builders.filter((a) => a.promiseKept === false).length;
	return kept >= 1 && kept > broken;
}

function counts(hackathon: Doc<"hackathons">, countsFrom?: string): boolean {
	return (
		hackathon.status === "done" &&
		isPaid(hackathon.participantsGet) &&
		(countsFrom === undefined || weekOf(hackathon.endsAt) >= countsFrom)
	);
}

/** Finished a paid Hackathon whose promise was kept: as its Founder, or as a Builder with an Approved Card. */
async function hasKeptHackathon(
	ctx: QueryCtx,
	userId: Id<"users">,
	countsFrom?: string,
): Promise<boolean> {
	const founded = await ctx.db
		.query("startups")
		.withIndex("by_founder", (q) => q.eq("founderId", userId))
		.take(MAX_USER_STARTUPS);
	for (const startup of founded) {
		const done = await ctx.db
			.query("hackathons")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", startup._id).eq("status", "done"),
			)
			.take(MAX_USER_APPLICATIONS);
		for (const hackathon of done) {
			if (
				counts(hackathon, countsFrom) &&
				(await promiseKept(ctx, hackathon._id))
			) {
				return true;
			}
		}
	}
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);
	for (const application of applications) {
		if (application.status !== "participating") continue;
		const hackathon = await ctx.db.get(application.hackathonId);
		if (!hackathon || !counts(hackathon, countsFrom)) continue;
		const cards = await ctx.db
			.query("cards")
			.withIndex("by_hackathon_and_owner", (q) =>
				q.eq("hackathonId", hackathon._id).eq("ownerId", userId),
			)
			.take(MAX_HACKATHON_CARDS);
		if (
			cards.some((card) => card.status === "done") &&
			(await promiseKept(ctx, hackathon._id))
		) {
			return true;
		}
	}
	return false;
}

/** What `nextTrust` needs about a person, counted from their `trustCountsFrom`. */
export async function loadTrustInputs(
	ctx: QueryCtx,
	user: Doc<"users">,
): Promise<{ progress: TrustProgress; lastOutsideWeek?: string }> {
	const countsFrom = user.trustCountsFrom;
	const [credits, hackathon] = await Promise.all([
		loadCredits(ctx, user._id, { fromWeek: countsFrom }),
		hasKeptHackathon(ctx, user._id, countsFrom),
	]);
	const outside = credits.filter((row) => !row.self && row.credit > 0);
	const high = outside.filter((row) => row.approverTrust !== "low");
	const weeksOf = (rows: Credit[]) => new Set(rows.map((row) => row.week));
	const lastOutsideWeek = [...weeksOf(outside)].sort().at(-1);
	return {
		progress: {
			weeks: weeksOf(outside).size,
			highWeeks: weeksOf(high).size,
			highStartups: await countUnrelated(
				ctx,
				[...new Set(high.map((row) => row.startupId))],
				user._id,
			),
			hackathon,
		},
		lastOutsideWeek,
	};
}
