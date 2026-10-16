import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	cycleNumber,
	shiftWeek,
	WEEK_MS,
	weekOf,
	weekStart,
} from "../shared/cycles";
import { MAX_CYCLE_ENTRIES, MAX_LISTED_CYCLES } from "../shared/limits";
import type { activityKind, jobRole } from "../shared/validators";
import { loadGoal } from "./goals";
import {
	buildParts,
	countedWeeks,
	loadStartupCounts,
	RATING,
	toPartsView,
} from "./rating";
import { loadPublicUser, type PublicUser } from "./users";

type ActivityKind = Infer<typeof activityKind>;
type JobRole = Infer<typeof jobRole>;

/** The only writer to `activity`, which is append-only. */
export async function appendActivity(
	ctx: MutationCtx,
	entry: {
		startupId: Id<"startups">;
		kind: ActivityKind;
		at: number;
		actorId?: Id<"users">;
		cardId?: Id<"cards">;
		hackathonId?: Id<"hackathons">;
		line?: string;
		selfVerified?: boolean;
	},
): Promise<void> {
	const { at, ...rest } = entry;
	await ctx.db.insert("activity", { ...rest, week: weekOf(at) });
}

export type EntryView = {
	id: Id<"activity">;
	kind: ActivityKind;
	at: number;
	actor: PublicUser | null;
	line: string | null;
	selfVerified: boolean;
	/** card_verified only; null when the Card is gone. */
	card: {
		title: string;
		links: string[];
		imageUrls: string[];
		verifier: PublicUser | null;
	} | null;
	/** hackathon_finished and builder_hired only; null when the Hackathon is gone. */
	job: { role: JobRole } | null;
};

export type CycleView = {
	week: string;
	number: number;
	startsAt: number;
	endsAt: number;
	goal: string | null;
	shippedCount: number;
	entries: EntryView[];
};

/** Milestones are all the public sees of a Cycle, besides its count. */
const MILESTONES: ActivityKind[] = ["hackathon_finished", "builder_hired"];

async function loadCard(ctx: QueryCtx, row: Doc<"activity">) {
	const card = row.cardId ? await ctx.db.get(row.cardId) : null;
	if (!card) {
		return null;
	}
	const urls = await Promise.all(
		(card.shipped?.images ?? []).map((id) => ctx.storage.getUrl(id)),
	);
	return {
		title: card.title,
		links: card.shipped?.links ?? [],
		imageUrls: urls.filter((url) => url !== null),
		verifier: await loadPublicUser(ctx, card.verifiedBy),
	};
}

async function loadJob(ctx: QueryCtx, row: Doc<"activity">) {
	const hackathon = row.hackathonId ? await ctx.db.get(row.hackathonId) : null;
	return hackathon ? { role: hackathon.job.role } : null;
}

async function toEntryView(
	ctx: QueryCtx,
	row: Doc<"activity">,
	masked: boolean,
): Promise<EntryView> {
	return {
		id: row._id,
		kind: row.kind,
		at: row._creationTime,
		actor: await loadPublicUser(ctx, row.actorId),
		line: masked ? null : (row.line ?? null),
		selfVerified: row.selfVerified ?? false,
		card:
			row.kind === "card_verified" && !masked ? await loadCard(ctx, row) : null,
		job: MILESTONES.includes(row.kind) ? await loadJob(ctx, row) : null,
	};
}

async function loadCycle(
	ctx: QueryCtx,
	startup: Doc<"startups">,
	week: string,
	masked: boolean,
): Promise<CycleView> {
	const rows = await ctx.db
		.query("activity")
		.withIndex("by_startup_and_week", (q) =>
			q.eq("startupId", startup._id).eq("week", week),
		)
		.order("desc")
		.take(MAX_CYCLE_ENTRIES);
	const shown = masked
		? rows.filter((row) => MILESTONES.includes(row.kind))
		: rows;
	const startsAt = weekStart(week);

	return {
		week,
		number: cycleNumber(startup._creationTime, startsAt),
		startsAt,
		endsAt: startsAt + WEEK_MS,
		goal: masked ? null : await loadGoal(ctx, startup._id, week),
		shippedCount: rows.filter((row) => row.kind === "card_verified").length,
		entries: await Promise.all(
			shown.map((row) => toEntryView(ctx, row, masked)),
		),
	};
}

/**
 * The Startup's newest `count` Cycles, empty ones included, back to its first.
 * `masked` keeps only what the public may see: the count and milestones.
 */
export async function loadCycles(
	ctx: QueryCtx,
	startup: Doc<"startups">,
	opts: { count: number; masked: boolean },
): Promise<{ cycles: CycleView[]; hasMore: boolean }> {
	const count = Math.min(Math.max(opts.count, 1), MAX_LISTED_CYCLES);
	const firstWeek = weekOf(startup._creationTime);
	const weeks: string[] = [];
	let week = weekOf(Date.now());
	while (weeks.length < count && week >= firstWeek) {
		weeks.push(week);
		week = shiftWeek(week, -1);
	}

	return {
		cycles: await Promise.all(
			weeks.map((w) => loadCycle(ctx, startup, w, opts.masked)),
		),
		hasMore: week >= firstWeek && count < MAX_LISTED_CYCLES,
	};
}

export type SignalsView = {
	rating: number;
	ratingChange: number;
	isProvisional: boolean;
	parts: ReturnType<typeof toPartsView>;
	/** 12 weeks ending with this one; `count` is null before signup. */
	strip: { week: string; startsAt: number; count: number | null }[];
	verifiedTotal12: number;
};

/** The Rating, its parts over finished weeks, and the 12-week rhythm strip. */
export async function loadSignals(
	ctx: QueryCtx,
	startup: Doc<"startups">,
	now: number,
): Promise<SignalsView> {
	const thisWeek = weekOf(now);
	const firstWeek = weekOf(startup._creationTime);
	// 13 weeks: the strip's 12 plus the one finished week before them that the parts count.
	const span = Array.from({ length: RATING.weeks + 1 }, (_, i) =>
		shiftWeek(thisWeek, i - RATING.weeks),
	).filter((week) => week >= firstWeek);
	const counted = await loadStartupCounts(ctx, startup._id, span);
	const countOf = new Map(span.map((week, i) => [week, counted[i]]));

	const strip = Array.from({ length: RATING.weeks }, (_, i) => {
		const week = shiftWeek(thisWeek, i + 1 - RATING.weeks);
		return {
			week,
			startsAt: weekStart(week),
			count: countOf.get(week) ?? null,
		};
	});
	const parts = buildParts(
		countedWeeks(startup._creationTime, shiftWeek(thisWeek, -1)).map(
			(week) => countOf.get(week) ?? 0,
		),
	);

	return {
		rating: startup.rating,
		ratingChange: startup.ratingChange,
		isProvisional: startup.provisional,
		parts: toPartsView(parts),
		strip,
		verifiedTotal12: strip.reduce((sum, cell) => sum + (cell.count ?? 0), 0),
	};
}
